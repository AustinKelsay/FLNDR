import axios, { AxiosInstance } from 'axios';
// Import all the other required types
import { 
  LndConnectionConfig, 
  GetInfoResponse,
  ChannelBalanceResponse,
  AddInvoiceRequest,
  AddInvoiceResponse,
  LookupInvoiceV2Request,
  Invoice,
  ListPaymentsRequest,
  ListPaymentsResponse,
  ListInvoicesRequest,
  ListInvoicesResponse,
  BitcoinNetwork,
  DecodedPaymentRequest,
  RouteFeesRequest,
  RouteFeesResponse,
  SendPaymentRequest,
  SendPaymentResponse,
  PaymentStatus
} from '../types/lnd';
import { toUrlSafeBase64Format, hexToUrlSafeBase64 } from '../utils/base64Utils';

// Handle WebSocket implementation differences
// This dynamic approach ensures compatibility with both browser and Node.js environments
let WebSocketImpl: any; // Using 'any' type to handle both browser WebSocket and Node.js ws package

// Use the browser's WebSocket if available, otherwise use ws library
if (typeof WebSocket !== 'undefined') {
  // Browser environment - use global WebSocket
  WebSocketImpl = WebSocket;
} else {
  try {
    // Node.js environment - use ws package
    // The dynamic require is necessary to avoid bundling issues in browser environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    WebSocketImpl = require('ws');
  } catch (e) {
    console.warn('WebSocket implementation not available');
  }
}

// Constants for WebSocket states since they might differ across platforms
// These ensure consistent behavior regardless of environment
const WS_CONNECTING = 0;
const WS_OPEN = 1;
const WS_CLOSING = 2;
const WS_CLOSED = 3;

/**
 * A minimal EventEmitter implementation that works in both Node.js and browsers
 */
class EventEmitter {
  private events: Record<string | symbol, Array<(...args: any[]) => void>> = {};

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  off(event: string | symbol, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      return this;
    }

    const idx = this.events[event].indexOf(listener);
    if (idx !== -1) {
      this.events[event].splice(idx, 1);
    }
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }

    const listeners = [...this.events[event]];
    for (const listener of listeners) {
      listener(...args);
    }
    return true;
  }

  removeAllListeners(event?: string | symbol): this {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
    return this;
  }

  listeners(event: string | symbol): Array<(...args: any[]) => void> {
    return this.events[event] || [];
  }
}

/**
 * LndStreamingEvents defines the events that can be emitted by LndClient for streaming connections
 */
export interface LndStreamingEvents {
  'open': { url: string, reconnecting?: boolean, attempt?: number, reconnected?: boolean };
  'error': { url: string, error: Error, message?: string, reconnecting?: boolean };
  'close': { url: string, code: number, reason: string, reconnecting?: boolean };
  'invoice': Invoice;
  'singleInvoice': Invoice;
  'paymentUpdate': PaymentStatus;
}

/**
 * LndClient provides a unified interface for interacting with LND's REST API
 * It supports both standard REST operations and streaming WebSocket connections
 */
export class LndClient extends EventEmitter {
  private readonly client: AxiosInstance;
  private readonly config: LndConnectionConfig;
  private network: BitcoinNetwork;
  private networkDetected: boolean = false;
  
  // Streaming-related properties
  private connections: Map<string, WebSocket> = new Map();
  // Update type to handle both browser number and Node.js Timeout
  private retryIntervals: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  // Default max retry count
  private readonly defaultMaxRetries: number = 5;
  // Default retry delay (exponential backoff will be applied)
  private readonly defaultRetryDelay: number = 1000;

  constructor(config: LndConnectionConfig) {
    super(); // Initialize the EventEmitter
    
    this.config = config;
    // Set default network to mainnet if not specified
    this.network = config.network || 'mainnet';

    // Create an axios instance with default configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Grpc-Metadata-macaroon': config.macaroon,
      },
      httpsAgent: config.tlsCert && typeof process !== 'undefined' ? 
        // Only create HTTPS agent in Node.js environment and when cert is provided
        new (require('https').Agent)({
          ca: config.tlsCert,
          rejectUnauthorized: true
        }) : 
        undefined,
    });
  }

  /**
   * Register a listener for standard event types
   */
  public on<K extends keyof LndStreamingEvents>(
    event: K, 
    listener: (data: LndStreamingEvents[K]) => void
  ): this;
  /**
   * Register a listener for any other event
   * @param event Event name
   * @param listener The callback function
   */
  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * Auto-detect the network by checking the node's info
   * This updates the internal network state
   */
  private async detectNetwork(): Promise<void> {
    if (this.networkDetected) return;
    
    try {
      const info = await this.getInfo();
      
      if (info.chains && info.chains.length > 0) {
        const chainNetwork = info.chains[0].network;
        
        // Map chain network value to our BitcoinNetwork type
        if (chainNetwork === 'mainnet') {
          this.network = 'mainnet';
        } else if (chainNetwork === 'regtest') {
          this.network = 'regtest';
        } else if (chainNetwork === 'signet') {
          this.network = 'signet';
        }
      }
      
      this.networkDetected = true;
    } catch (error) {
      // If we can't detect, just keep the default network
      console.warn('Could not auto-detect network, using provided network value');
    }
  }

  /**
   * Get the current network this client is connected to
   * Will auto-detect the network if not already done
   * @returns The Bitcoin network (mainnet, regtest, signet)
   */
  public async getNetwork(): Promise<BitcoinNetwork> {
    if (!this.networkDetected) {
      await this.detectNetwork();
    }
    return this.network;
  }

  /**
   * Check if the client is connected to mainnet
   * @returns True if connected to mainnet
   */
  public async isMainnet(): Promise<boolean> {
    if (!this.networkDetected) {
      await this.detectNetwork();
    }
    return this.network === 'mainnet';
  }

  /**
   * Check if the client is connected to signet
   * @returns True if connected to signet
   */
  public async isSignet(): Promise<boolean> {
    if (!this.networkDetected) {
      await this.detectNetwork();
    }
    return this.network === 'signet';
  }

  /**
   * Get basic information about the LND node
   * @returns Information about the LND node
   */
  public async getInfo(): Promise<GetInfoResponse> {
    try {
      const response = await this.client.get<GetInfoResponse>('/v1/getinfo');
      return response.data;
    } catch (error) {
      // Wrap the error with our custom message
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get LND info: ${errorMessage}`);
    }
  }

  /**
   * Get channel balance information
   * @returns Channel balance information
   */
  public async channelBalance(): Promise<ChannelBalanceResponse> {
    try {
      // Use the newer endpoint (LND v0.15.0+)
      const response = await this.client.get<ChannelBalanceResponse>('/v1/balance/channels');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get channel balance: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Create a new invoice
   * @param request Invoice parameters
   * @returns Invoice creation response
   */
  public async addInvoice(request: AddInvoiceRequest = {}): Promise<AddInvoiceResponse> {
    try {
      const response = await this.client.post<AddInvoiceResponse>('/v1/invoices', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create invoice: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Lookup an invoice by payment hash using the v2 endpoint
   * This method uses the newer /v2/invoices/lookup endpoint which requires a URL-safe base64 encoded payment hash
   * 
   * @param paymentHash Payment hash (can be hex or base64 encoded, will be converted to URL-safe base64)
   * @returns Invoice details
   */
  public async lookupInvoiceV2(paymentHash: string): Promise<Invoice> {
    try {
      // Convert the payment hash to URL-safe base64 format
      const urlSafeBase64Hash = toUrlSafeBase64Format(paymentHash);
      
      // Create request params
      const params: LookupInvoiceV2Request = {
        payment_hash: urlSafeBase64Hash
      };
      
      // Use the v2 endpoint with URL-safe base64
      const response = await this.client.get<Invoice>(`/v2/invoices/lookup`, {
        params
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Extract detailed error information if available
        const status = error.response.status;
        const errorData = error.response.data;
        
        // For error types, include as much detail as possible
        const errorDetail = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
        throw new Error(`Failed to lookup invoice (status ${status}): ${errorDetail || error.message}`);
      }
      
      // For non-Axios errors or missing response
      throw new Error(`Failed to lookup invoice: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all invoices
   * @param request Invoice listing parameters
   * @returns List of invoices
   */
  public async listInvoices(request: ListInvoicesRequest = {}): Promise<ListInvoicesResponse> {
    try {
      // Convert the request object to URL query parameters
      const params = new URLSearchParams();
      if (request.pending_only !== undefined) params.append('pending_only', request.pending_only.toString());
      if (request.index_offset) params.append('index_offset', request.index_offset);
      if (request.num_max_invoices) params.append('num_max_invoices', request.num_max_invoices.toString());
      if (request.reversed !== undefined) params.append('reversed', request.reversed.toString());
      if (request.creation_date_start) params.append('creation_date_start', request.creation_date_start);
      if (request.creation_date_end) params.append('creation_date_end', request.creation_date_end);

      const url = `/v1/invoices?${params.toString()}`;
      const response = await this.client.get<ListInvoicesResponse>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to list invoices: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List payments
   * @param request Payment listing parameters
   * @returns List of payments
   */
  public async listPayments(request: ListPaymentsRequest = {}): Promise<ListPaymentsResponse> {
    try {
      // Convert the request object to URL query parameters
      const params = new URLSearchParams();
      if (request.include_incomplete !== undefined) params.append('include_incomplete', request.include_incomplete.toString());
      if (request.index_offset) params.append('index_offset', request.index_offset);
      if (request.max_payments) params.append('max_payments', request.max_payments.toString());
      if (request.reversed !== undefined) params.append('reversed', request.reversed.toString());
      if (request.count_total_payments !== undefined) params.append('count_total_payments', request.count_total_payments.toString());
      if (request.creation_date_start) params.append('creation_date_start', request.creation_date_start);
      if (request.creation_date_end) params.append('creation_date_end', request.creation_date_end);

      const url = `/v1/payments?${params.toString()}`;
      const response = await this.client.get<ListPaymentsResponse>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to list payments: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Decode a Lightning payment request (bolt11 invoice)
   * @param paymentRequest The payment request string to decode
   * @returns Decoded payment request details
   */
  public async decodePayReq(paymentRequest: string): Promise<DecodedPaymentRequest> {
    try {
      const response = await this.client.get<DecodedPaymentRequest>(`/v1/payreq/${encodeURIComponent(paymentRequest)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Extract detailed error information if available
        const status = error.response.status;
        const errorData = error.response.data;
        
        // For error types, include as much detail as possible
        const errorDetail = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
        throw new Error(`Failed to decode payment request (status ${status}): ${errorDetail || error.message}`);
      }
      
      // For non-Axios errors or missing response
      throw new Error(`Failed to decode payment request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Estimate the routing fees for a payment
   * @param request Route fee estimation parameters
   * @returns Estimated routing fees and probability of success
   */
  public async estimateRouteFee(request: RouteFeesRequest): Promise<RouteFeesResponse> {
    try {
      // Convert hex pubkey to URL-safe base64
      const destBase64 = hexToUrlSafeBase64(request.dest);
      
      // Create a request object matching exactly what the LND API expects
      const requestBody: any = {
        dest: destBase64,
        amt_sat: request.amt_sat,
        // Default timeout of 60 seconds if not specified
        timeout: request.timeout !== undefined ? request.timeout : 60
      };
      
      const response = await this.client.post<RouteFeesResponse>(
        '/v2/router/route/estimatefee',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Extract detailed error information if available
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 500) {
          // For 500 errors, try to extract more detailed error information
          const errorMessage = errorData?.error || errorData?.message || error.message;
          throw new Error(`Failed to estimate route fees (status 500): ${errorMessage}. This often means no route was found for the specified amount.`);
        }
        
        // For other error types, include as much detail as possible
        const errorDetail = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
        throw new Error(`Failed to estimate route fees (status ${status}): ${errorDetail || error.message}`);
      }
      
      // For non-Axios errors or missing response
      throw new Error(`Failed to estimate route fees: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send a Lightning payment
   * @param request Payment request parameters
   * @returns Payment result
   */
  public async sendPaymentV2(request: SendPaymentRequest): Promise<SendPaymentResponse> {
    try {
      // Create a new request object with default timeout if not provided
      const paymentRequest = {
        ...request,
        timeout_seconds: request.timeout_seconds || 60 // Default 60 second timeout
      };
      
      const response = await this.client.post<SendPaymentResponse>('/v2/router/send', paymentRequest);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Extract detailed error information if available
        const status = error.response.status;
        const errorData = error.response.data;
        
        // For error types, include as much detail as possible
        const errorDetail = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
        throw new Error(`Failed to send payment (status ${status}): ${errorDetail || error.message}`);
      }
      
      // For non-Axios errors or missing response
      throw new Error(`Failed to send payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==========================================================================
  // STREAMING METHODS
  // ==========================================================================

  /**
   * Create a WebSocket URL from an HTTP URL
   * @param httpUrl HTTP URL to convert
   * @returns WebSocket URL (wss:// or ws://)
   */
  private httpToWsUrl(httpUrl: string): string {
    return httpUrl.replace(/^http/, 'ws');
  }

  /**
   * Add event listener to a WebSocket connection based on available method (for cross-platform support)
   * This method abstracts the differences between browser WebSocket and Node.js ws package:
   * - Browser WebSockets use addEventListener()
   * - Node.js ws package uses on()
   * 
   * @param ws WebSocket connection
   * @param event Event name ('open', 'message', 'error', 'close', etc.)
   * @param callback Callback function to handle the event
   */
  private addEventListenerToWebSocket(ws: any, event: string, callback: (...args: any[]) => void): void {
    if (typeof ws.addEventListener === 'function') {
      // Browser WebSocket API
      ws.addEventListener(event, callback);
    } else if (typeof ws.on === 'function') {
      // Node.js ws package
      ws.on(event, callback);
    } else {
      console.warn(`Cannot attach ${event} listener - no suitable method found on WebSocket`);
    }
  }

  /**
   * Create a new WebSocket connection
   * @param url REST API URL to connect to
   * @param headers HTTP headers for authentication
   * @param enableRetry Whether to enable automatic retries on disconnection
   * @param maxRetries Maximum number of retry attempts (default: 5)
   * @param retryDelay Base delay for retries in ms, will be increased exponentially (default: 1000)
   * @returns WebSocket connection
   */
  private createWebSocketConnection(
    url: string, 
    headers: Record<string, string>, 
    enableRetry: boolean = false,
    maxRetries: number = this.defaultMaxRetries,
    retryDelay: number = this.defaultRetryDelay
  ): WebSocket {
    const wsUrl = this.httpToWsUrl(url);
    
    // Create WebSocket - handle different constructor signatures for browser vs Node.js
    let ws: any;
    
    if (typeof window !== 'undefined') {
      // Browser environment - browsers don't support custom headers in WebSocket constructor
      ws = new WebSocketImpl(wsUrl);
    } else {
      // Node.js environment - use the ws package which supports options
      ws = new WebSocketImpl(wsUrl, { headers });
    }
    
    // Set up event listeners
    this.addEventListenerToWebSocket(ws, 'open', () => {
      // Reset retry attempts when connection is successful
      this.retryAttempts.set(url, 0);
      this.emit('open', { url });
    });

    this.addEventListenerToWebSocket(ws, 'error', (event) => {
      const error = new Error('WebSocket error occurred');
      this.emit('error', { url, error });
    });

    this.addEventListenerToWebSocket(ws, 'close', (event) => {
      // Handle cross-platform differences between browser & node.js WebSocket
      const code = typeof event.code === 'number' ? event.code : 0;
      const reason = typeof event.reason === 'string' ? event.reason : '';
      
      this.emit('close', { url, code, reason });
      this.connections.delete(url);
      
      // Implement retry logic if enabled
      if (enableRetry) {
        this.retryConnection(url, headers, maxRetries, retryDelay);
      }
    });

    // Store the connection for later reference
    this.connections.set(url, ws);
    
    return ws;
  }

  /**
   * Retry a connection with exponential backoff
   * @param url URL to reconnect to
   * @param headers HTTP headers for authentication
   * @param maxRetries Maximum number of retry attempts
   * @param retryDelay Base delay for retries in ms
   */
  private retryConnection(
    url: string, 
    headers: Record<string, string>,
    maxRetries: number,
    retryDelay: number
  ): void {
    // Clear any existing retry interval
    if (this.retryIntervals.has(url)) {
      clearTimeout(this.retryIntervals.get(url)!);
      this.retryIntervals.delete(url);
    }
    
    // Get current retry attempt count or initialize to 0
    const attemptCount = this.retryAttempts.get(url) || 0;
    
    // Check if we've exceeded max retries
    if (attemptCount >= maxRetries) {
      this.emit('error', { 
        url, 
        error: new Error(`Maximum retry attempts (${maxRetries}) reached for ${url}`),
        message: 'Connection retry limit reached'
      });
      return;
    }
    
    // Increment retry count
    this.retryAttempts.set(url, attemptCount + 1);
    
    // Calculate delay with exponential backoff (2^attempt * delay)
    const delay = retryDelay * Math.pow(2, attemptCount);
    
    // Set timeout for retry - store timeout ID as number
    const timeoutId = setTimeout(() => {
      this.emit('open', { url, reconnecting: true, attempt: attemptCount + 1 });
      
      // Attempt to reconnect
      const wsUrl = this.httpToWsUrl(url);
      const ws = new WebSocketImpl(wsUrl, typeof window === 'undefined' ? { headers } : undefined);
      
      // Set up event listeners on new connection
      this.addEventListenerToWebSocket(ws, 'open', () => {
        this.emit('open', { url, reconnected: true });
        this.connections.set(url, ws);
        this.retryAttempts.set(url, 0);
        this.retryIntervals.delete(url);
      });
      
      this.addEventListenerToWebSocket(ws, 'error', (event) => {
        const error = new Error('WebSocket error occurred during reconnection');
        this.emit('error', { url, error, reconnecting: true });
        // Let the close handler handle the retry
      });
      
      this.addEventListenerToWebSocket(ws, 'close', (event) => {
        // Handle cross-platform differences
        const code = typeof event.code === 'number' ? event.code : 0;
        const reason = typeof event.reason === 'string' ? event.reason : '';
        
        this.emit('close', { url, code, reason, reconnecting: true });
        this.connections.delete(url);
        // Try again
        this.retryConnection(url, headers, maxRetries, retryDelay);
      });
      
    }, delay);
    
    this.retryIntervals.set(url, timeoutId);
  }

  /**
   * Close a specific WebSocket connection
   * @param url URL of the connection to close
   */
  public closeConnection(url: string): void {
    const connection = this.connections.get(url);
    if (connection) {
      connection.close();
      this.connections.delete(url);
    }
    
    // Clean up retry state
    if (this.retryIntervals.has(url)) {
      clearTimeout(this.retryIntervals.get(url)!);
      this.retryIntervals.delete(url);
    }
    this.retryAttempts.delete(url);
  }

  /**
   * Close all active WebSocket connections
   */
  public closeAllConnections(): void {
    for (const [url, connection] of this.connections.entries()) {
      connection.close();
      this.connections.delete(url);
      
      // Clean up retry state
      if (this.retryIntervals.has(url)) {
        clearTimeout(this.retryIntervals.get(url)!);
        this.retryIntervals.delete(url);
      }
    }
    this.retryAttempts.clear();
  }

  /**
   * Check if a specific WebSocket connection is active
   * @param url URL of the connection to check
   * @returns True if the connection exists and is in the OPEN state
   */
  public isConnectionActive(url: string): boolean {
    const connection = this.connections.get(url);
    return connection !== undefined && connection.readyState === WS_OPEN;
  }

  /**
   * Get the status of a specific WebSocket connection
   * @param url URL of the connection to check
   * @returns Connection status or null if connection doesn't exist
   */
  public getConnectionStatus(url: string): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | null {
    const connection = this.connections.get(url);
    if (!connection) {
      return null;
    }

    switch (connection.readyState) {
      case WS_CONNECTING:
        return 'CONNECTING';
      case WS_OPEN:
        return 'OPEN';
      case WS_CLOSING:
        return 'CLOSING';
      case WS_CLOSED:
        return 'CLOSED';
      default:
        return null;
    }
  }

  /**
   * Subscribe to all invoices
   * @param enableRetry Whether to automatically retry on disconnection (default: true)
   * @param maxRetries Maximum number of retry attempts (default: 5)
   * @param retryDelay Base delay for retries in ms, will be increased exponentially (default: 1000)
   * @returns URL of the subscription
   */
  public subscribeInvoices(
    enableRetry: boolean = true,
    maxRetries: number = this.defaultMaxRetries,
    retryDelay: number = this.defaultRetryDelay
  ): string {
    const url = `${this.config.baseUrl}/v1/invoices/subscribe`;
    const headers = this.getHeaders();
    
    const ws = this.createWebSocketConnection(url, headers, enableRetry, maxRetries, retryDelay);
    
    this.addEventListenerToWebSocket(ws, 'message', (event) => {
      try {
        const invoice = this.parseWebSocketMessage(event) as Invoice;
        this.emit('invoice', invoice);
      } catch (error) {
        this.emit('error', { url, error, message: 'Failed to parse invoice data' });
      }
    });
    
    return url;
  }

  /**
   * Subscribe to a specific invoice
   * @param paymentHash Payment hash of the invoice to subscribe to
   * @param enableRetry Whether to automatically retry on disconnection
   * @param maxRetries Maximum number of retry attempts
   * @param retryDelay Base delay for retries in ms
   * @returns URL of the subscription
   */
  public subscribeSingleInvoice(
    paymentHash: string,
    enableRetry: boolean = true,
    maxRetries: number = this.defaultMaxRetries,
    retryDelay: number = this.defaultRetryDelay
  ): string {
    const url = `${this.config.baseUrl}/v2/invoices/subscribe/${paymentHash}`;
    const headers = this.getHeaders();
    
    const ws = this.createWebSocketConnection(url, headers, enableRetry, maxRetries, retryDelay);
    
    this.addEventListenerToWebSocket(ws, 'message', (event) => {
      try {
        const invoice = this.parseWebSocketMessage(event) as Invoice;
        this.emit('singleInvoice', invoice);
      } catch (error) {
        this.emit('error', { url, error, message: 'Failed to parse invoice data' });
      }
    });
    
    return url;
  }

  /**
   * Track a specific payment by hash
   * @param paymentHash Payment hash to track
   * @param enableRetry Whether to automatically retry on disconnection
   * @param maxRetries Maximum number of retry attempts
   * @param retryDelay Base delay for retries in ms
   * @returns URL of the subscription
   */
  public trackPaymentByHash(
    paymentHash: string,
    enableRetry: boolean = true,
    maxRetries: number = this.defaultMaxRetries,
    retryDelay: number = this.defaultRetryDelay
  ): string {
    // Ensure payment hash is properly formatted
    const formattedHash = paymentHash.startsWith('0x') ? paymentHash.substring(2) : paymentHash;
    
    const url = `${this.config.baseUrl}/v2/router/track/${formattedHash}`;
    const headers = this.getHeaders();
    
    const ws = this.createWebSocketConnection(url, headers, enableRetry, maxRetries, retryDelay);
    
    this.addEventListenerToWebSocket(ws, 'message', (event) => {
      try {
        const paymentUpdate = this.parseWebSocketMessage(event) as PaymentStatus;
        this.emit('paymentUpdate', paymentUpdate);
      } catch (error) {
        this.emit('error', { url, error, message: 'Failed to parse payment status data' });
      }
    });
    
    return url;
  }

  /**
   * Track all payments
   * @param noInflightUpdates Whether to exclude in-flight payment updates
   * @param enableRetry Whether to automatically retry on disconnection
   * @param maxRetries Maximum number of retry attempts
   * @param retryDelay Base delay for retries in ms
   * @returns URL of the subscription
   */
  public trackPaymentV2(
    noInflightUpdates: boolean = false,
    enableRetry: boolean = true,
    maxRetries: number = this.defaultMaxRetries,
    retryDelay: number = this.defaultRetryDelay
  ): string {
    const url = `${this.config.baseUrl}/v2/router/trackpayments?no_inflight_updates=${noInflightUpdates}`;
    const headers = this.getHeaders();
    
    const ws = this.createWebSocketConnection(url, headers, enableRetry, maxRetries, retryDelay);
    
    this.addEventListenerToWebSocket(ws, 'message', (event) => {
      try {
        const paymentUpdate = this.parseWebSocketMessage(event) as PaymentStatus;
        this.emit('paymentUpdate', paymentUpdate);
      } catch (error) {
        this.emit('error', { url, error, message: 'Failed to parse payment update data' });
      }
    });
    
    return url;
  }

  /**
   * Get the standard headers for LND REST API requests
   * @returns HTTP headers object
   */
  private getHeaders(): Record<string, string> {
    return {
      'Grpc-Metadata-macaroon': this.config.macaroon
    };
  }

  /**
   * Handle WebSocket message data accounting for browser vs Node.js differences
   * @param eventData The data from the message event
   * @returns Parsed data object
   */
  private parseWebSocketMessage(eventData: any): any {
    // In browser, event.data contains the data
    // In Node.js ws package, the data might be passed directly
    const data = typeof eventData === 'object' && eventData.data !== undefined
      ? eventData.data  // Browser format: event.data
      : eventData;      // Node.js format: data directly
      
    // Handle different data types (string vs Buffer)
    if (typeof data === 'string') {
      return JSON.parse(data);
    } else if (Buffer && (data instanceof Buffer || Buffer.isBuffer(data))) {
      return JSON.parse(data.toString());
    } else {
      throw new Error('Unsupported message data format');
    }
  }
}