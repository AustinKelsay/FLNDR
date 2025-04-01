import axios, { AxiosInstance } from 'axios';
import { 
  LndConnectionConfig, 
  GetInfoResponse,
  ChannelBalanceResponse,
  AddInvoiceRequest,
  AddInvoiceResponse,
  LookupInvoiceRequest,
  Invoice,
  ListPaymentsRequest,
  ListPaymentsResponse,
  ListInvoicesRequest,
  ListInvoicesResponse,
  BitcoinNetwork
} from '../types/lnd';
import { toUrlSafeBase64, fromUrlSafeBase64, hexToUrlSafeBase64, urlSafeBase64ToHex, toUrlSafeBase64Format } from '../utils/base64Utils';

export class LndClient {
  private readonly client: AxiosInstance;
  private readonly config: LndConnectionConfig;
  private network: BitcoinNetwork;
  private networkDetected: boolean = false;

  constructor(config: LndConnectionConfig) {
    this.config = config;
    // Set default network to mainnet if not specified
    this.network = config.network || 'mainnet';

    // Create an axios instance with default configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Grpc-Metadata-macaroon': config.macaroon,
      },
      httpsAgent: config.tlsCert ? undefined : undefined, // TLS implementation can be added here
    });
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
   * Lookup an invoice by payment hash
   * @param r_hash_str Payment hash (can be hex or base64 encoded)
   * @returns Invoice details
   */
  public async lookupInvoiceV2(r_hash_str: string): Promise<Invoice> {
    try {
      // Convert the payment hash to URL-safe base64 format
      const urlSafeBase64Hash = toUrlSafeBase64Format(r_hash_str);
      
      // Use the v2 endpoint with URL-safe base64
      const response = await this.client.get<Invoice>(`/v2/invoices/lookup`, {
        params: { payment_hash: urlSafeBase64Hash }
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to lookup invoice: ${error.message}`);
      }
      throw error;
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
}