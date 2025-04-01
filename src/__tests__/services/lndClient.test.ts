import axios, { AxiosError } from 'axios';
import WebSocket from 'ws';
import { LndClient } from '../../services/lndClient';
import { hexToUrlSafeBase64 } from '../../utils/base64Utils';
import {
  GetInfoResponse,
  ChannelBalanceResponse,
  AddInvoiceResponse,
  Invoice,
  ListPaymentsResponse,
  ListInvoicesResponse,
  DecodedPaymentRequest,
  RouteFeesResponse,
  RouteFeesRequest,
  SendPaymentResponse,
  SendPaymentRequest
} from '../../types/lnd';
import { EventEmitter } from 'events';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
  isAxiosError: jest.fn(),
}));

// Mock WebSocket
jest.mock('ws');

// Get the mocked axios instance
const mockedAxios = {
  get: jest.fn(),
  post: jest.fn(),
};

// Cast the mocked WebSocket class
const MockedWebSocket = WebSocket as jest.MockedClass<typeof WebSocket>;

// Mock axios.create to return our mockedAxios
(axios.create as jest.Mock).mockReturnValue(mockedAxios);

// Cast the mocked function with proper typing
const mockedIsAxiosError = axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>;

describe('LndClient', () => {
  let lndClient: LndClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new LndClient instance for each test
    lndClient = new LndClient({
      baseUrl: 'https://test-lnd-node:8080',
      macaroon: 'test-macaroon-hex',
    });
  });
  
  describe('getInfo', () => {
    it('should return node info', async () => {
      // Mock response data
      const mockResponse: GetInfoResponse = {
        version: '0.15.5-beta',
        commit_hash: 'v0.15.5-beta-1-g3c93d9d6a',
        identity_pubkey: '02a9c4e6c1d0d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
        alias: 'test-node',
        color: '#3399ff',
        num_pending_channels: 0,
        num_active_channels: 5,
        num_inactive_channels: 1,
        num_peers: 8,
        block_height: 750000,
        block_hash: '00000000000000000000a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
        best_header_timestamp: '1650000000',
        synced_to_chain: true,
        synced_to_graph: true,
        chains: [{ chain: 'bitcoin', network: 'mainnet' }],
        uris: ['02a9c4e6c1d0d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8@1.2.3.4:9735'],
        features: {},
      };
      
      // Setup axios mock
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });
      
      // Execute the method
      const result = await lndClient.getInfo();
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/v1/getinfo');
      expect(result).toEqual(mockResponse);
    });
    
    it('should handle errors', async () => {
      // Create an AxiosError
      const error = new Error('API error') as AxiosError;
      error.isAxiosError = true;
      mockedAxios.get.mockRejectedValue(error);
      
      // Mock axios.isAxiosError to return true for our error
      mockedIsAxiosError.mockReturnValue(true);
      
      // Test that it throws an error with the expected message
      try {
        await lndClient.getInfo();
        // If we get here, the test should fail
        fail('Expected getInfo to throw an error');
      } catch (e) {
        expect((e as Error).message).toContain('Failed to get LND info: API error');
      }
    });
  });
  
  describe('channelBalance', () => {
    it('should return channel balance info', async () => {
      // Mock response data
      const mockResponse: ChannelBalanceResponse = {
        balance: '1000000',
        pending_open_balance: '500000',
        local_balance: { sat: '800000', msat: '800000000' },
        remote_balance: { sat: '200000', msat: '200000000' },
        unsettled_local_balance: { sat: '0', msat: '0' },
        unsettled_remote_balance: { sat: '0', msat: '0' },
        pending_open_local_balance: { sat: '300000', msat: '300000000' },
        pending_open_remote_balance: { sat: '200000', msat: '200000000' },
      };
      
      // Setup axios mock
      mockedAxios.get.mockResolvedValue({ data: mockResponse });
      
      // Execute the method
      const result = await lndClient.channelBalance();
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/v1/balance/channels');
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      // Create an AxiosError
      const error = new Error('API error') as AxiosError;
      error.isAxiosError = true;
      mockedAxios.get.mockRejectedValue(error);
      
      // Mock axios.isAxiosError to return true for our error
      mockedIsAxiosError.mockReturnValue(true);
      
      // Test that it throws an error with the expected message
      await expect(lndClient.channelBalance()).rejects.toThrow('Failed to get channel balance: API error');
    });
  });
  
  describe('addInvoice', () => {
    it('should create an invoice', async () => {
      // Mock response data
      const mockResponse: AddInvoiceResponse = {
        r_hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        payment_request: 'lnbc10u1p0nk97app...',
        add_index: '42',
        payment_addr: 'f7d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7',
      };
      
      // Setup axios mock
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });
      
      // Execute the method
      const invoiceRequest = {
        memo: 'Test invoice',
        value: '100000',
        expiry: '3600',
      };
      const result = await lndClient.addInvoice(invoiceRequest);
      
      // Assertions
      expect(mockedAxios.post).toHaveBeenCalledWith('/v1/invoices', invoiceRequest);
      expect(result).toEqual(mockResponse);
    });
  });
  
  describe('lookupInvoiceV2', () => {
    // Mock response data for all tests
    const mockResponse: Invoice = {
      memo: 'Test invoice',
      r_preimage: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      r_hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      value: '100000',
      value_msat: '100000000',
      settled: false,
      creation_date: '1650000000',
      settle_date: '',
      payment_request: 'lnbc10u1p0nk97app...',
      description_hash: '',
      expiry: '3600',
      fallback_addr: '',
      cltv_expiry: '40',
      route_hints: [],
      private: false,
      add_index: '42',
      settle_index: '0',
      amt_paid: '0',
      amt_paid_sat: '0',
      amt_paid_msat: '0',
      state: 'OPEN',
      htlcs: [],
      features: {},
      is_keysend: false,
      payment_addr: 'f7d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7',
      is_amp: false,
    };
    
    it('should return invoice details using URL-safe base64', async () => {
      // Setup axios mock
      mockedAxios.get.mockImplementation((url, config) => {
        if (url === '/v2/invoices/lookup' && 
            config?.params?.payment_hash) {
          return Promise.resolve({ data: mockResponse });
        }
        return Promise.reject(new Error('Not found'));
      });
      
      // Execute the method
      const rHashStr = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
      const result = await lndClient.lookupInvoiceV2(rHashStr);
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/v2/invoices/lookup', expect.objectContaining({
        params: { payment_hash: expect.any(String) }
      }));
      expect(result).toEqual(mockResponse);
    });
    
    it('should handle errors when API call fails', async () => {
      // Create an AxiosError
      const error = new Error('API error') as AxiosError;
      error.isAxiosError = true;
      mockedAxios.get.mockRejectedValue(error);
      
      // Mock axios.isAxiosError to return true for our error
      mockedIsAxiosError.mockReturnValue(true);
      
      // Test that it throws an error with the expected message
      const rHashStr = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
      await expect(lndClient.lookupInvoiceV2(rHashStr)).rejects.toThrow('Failed to lookup invoice: API error');
    });
  });
  
  describe('listInvoices', () => {
    it('should return a list of invoices', async () => {
      // Mock invoice
      const mockInvoice: Invoice = {
        memo: 'Test invoice',
        r_preimage: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        r_hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        value: '100000',
        value_msat: '100000000',
        settled: false,
        creation_date: '1650000000',
        settle_date: '',
        payment_request: 'lnbc10u1p0nk97app...',
        description_hash: '',
        expiry: '3600',
        fallback_addr: '',
        cltv_expiry: '40',
        route_hints: [],
        private: false,
        add_index: '42',
        settle_index: '0',
        amt_paid: '0',
        amt_paid_sat: '0',
        amt_paid_msat: '0',
        state: 'OPEN',
        htlcs: [],
        features: {},
        is_keysend: false,
        payment_addr: 'f7d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7',
        is_amp: false,
      };
      
      // Mock response data
      const mockResponse: ListInvoicesResponse = {
        invoices: [mockInvoice],
        last_index_offset: '43',
        first_index_offset: '42',
      };
      
      // Setup axios mock
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });
      
      // Execute the method with some options
      const options = {
        num_max_invoices: 10,
        pending_only: true,
      };
      const result = await lndClient.listInvoices(options);
      
      // Use a more flexible assertion that doesn't care about parameter order
      expect(mockedAxios.get).toHaveBeenCalled();
      const url = mockedAxios.get.mock.calls[0][0];
      expect(url).toContain('/v1/invoices?');
      expect(url).toContain('num_max_invoices=10');
      expect(url).toContain('pending_only=true');
      expect(result).toEqual(mockResponse);
    });
  });
  
  describe('listPayments', () => {
    it('should return a list of payments', async () => {
      // Mock response data
      const mockResponse: ListPaymentsResponse = {
        payments: [{
          payment_hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
          value: '100000',
          creation_date: '1650000000',
          fee: '100',
          payment_preimage: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
          value_sat: '100000',
          value_msat: '100000000',
          payment_request: 'lnbc10u1p0nk97app...',
          status: 'SUCCEEDED',
          fee_sat: '100',
          fee_msat: '100000',
          creation_time_ns: '1650000000000000000',
          htlcs: [],
          path: [],
          failure_reason: 'FAILURE_REASON_NONE',
        }],
        first_index_offset: '99',
        last_index_offset: '100',
        total_num_payments: '100',
      };
      
      // Setup axios mock
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });
      
      // Execute the method with some options
      const options = {
        max_payments: 5,
        include_incomplete: true,
      };
      const result = await lndClient.listPayments(options);
      
      // Use a more flexible assertion that doesn't care about parameter order
      expect(mockedAxios.get).toHaveBeenCalled();
      const url = mockedAxios.get.mock.calls[0][0];
      expect(url).toContain('/v1/payments?');
      expect(url).toContain('max_payments=5');
      expect(url).toContain('include_incomplete=true');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Network Detection', () => {
    it('should detect mainnet', async () => {
      // Mock getInfo response for mainnet
      const mockResponse: GetInfoResponse = {
        version: '0.15.5-beta',
        commit_hash: 'v0.15.5-beta-1-g3c93d9d6a',
        identity_pubkey: '02a9c4e6c1d0d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
        alias: 'mainnet-node',
        color: '#3399ff',
        num_pending_channels: 0,
        num_active_channels: 5,
        num_inactive_channels: 1,
        num_peers: 8,
        block_height: 750000,
        block_hash: '00000000000000000000a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
        best_header_timestamp: '1650000000',
        synced_to_chain: true,
        synced_to_graph: true,
        chains: [{ chain: 'bitcoin', network: 'mainnet' }],
        uris: ['02a9c4e6c1d0d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8@1.2.3.4:9735'],
        features: {},
      };
      
      // Setup axios mock
      mockedAxios.get.mockResolvedValue({ data: mockResponse });
      
      // Test network detection
      expect(await lndClient.getNetwork()).toBe('mainnet');
      expect(await lndClient.isMainnet()).toBe(true);
      expect(await lndClient.isSignet()).toBe(false);
    });
    
    it('should detect signet', async () => {
      // Mock getInfo response for signet
      const mockResponse: GetInfoResponse = {
        version: '0.15.5-beta',
        commit_hash: 'v0.15.5-beta-1-g3c93d9d6a',
        identity_pubkey: '02a9c4e6c1d0d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
        alias: 'signet-node',
        color: '#3399ff',
        num_pending_channels: 0,
        num_active_channels: 5,
        num_inactive_channels: 1,
        num_peers: 8,
        block_height: 750000,
        block_hash: '00000000000000000000a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
        best_header_timestamp: '1650000000',
        synced_to_chain: true,
        synced_to_graph: true,
        chains: [{ chain: 'bitcoin', network: 'signet' }],
        uris: ['02a9c4e6c1d0d2c3b4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8@1.2.3.4:9735'],
        features: {},
      };
      
      // Setup axios mock
      mockedAxios.get.mockResolvedValue({ data: mockResponse });
      
      // Test network detection
      expect(await lndClient.getNetwork()).toBe('signet');
      expect(await lndClient.isMainnet()).toBe(false);
      expect(await lndClient.isSignet()).toBe(true);
    });
    
    it('should handle errors during network detection', async () => {
      // Mock console.warn to capture warnings
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      // Setup axios mock to reject
      const error = new Error('Request failed with status code 500');
      (error as any).isAxiosError = true;
      mockedAxios.get.mockRejectedValue(error);
      
      // Create client with explicit network to test fallback
      const clientWithNetwork = new LndClient({
        baseUrl: 'https://test-lnd-node:8080',
        macaroon: 'test-macaroon-hex',
        network: 'signet'
      });
      
      // Test that it falls back to the provided network
      expect(await clientWithNetwork.getNetwork()).toBe('signet');
      expect(console.warn).toHaveBeenCalled();
      
      // Restore console.warn
      console.warn = originalWarn;
    });
  });

  describe('decodePayReq', () => {
    const mockResponse: DecodedPaymentRequest = {
      destination: 'abc123....',
      payment_hash: 'def456...',
      num_satoshis: '100000',
      timestamp: '1650000000',
      expiry: '3600',
      description: 'Test payment',
      description_hash: '',
      fallback_addr: '',
      cltv_expiry: '40',
      route_hints: [],
      payment_addr: 'xyz789...',
      num_msat: '100000000',
      features: {},
    };

    it('should decode a payment request', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const paymentRequest = 'lnbc1...';
      const result = await lndClient.decodePayReq(paymentRequest);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/v1/payreq/${encodeURIComponent(paymentRequest)}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when decoding payment request', async () => {
      const error = new Error('Invalid payment request');
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedIsAxiosError.mockReturnValueOnce(true);

      await expect(lndClient.decodePayReq('invalid')).rejects.toThrow('Failed to decode payment request');
    });
  });

  describe('estimateRouteFee', () => {
    it('should successfully estimate route fees', async () => {
      const mockResponse: RouteFeesResponse = {
        routing_fee_msat: '1000',
        time_lock_delay: 144
      };

      const mockRequest = {
        dest: '0369bbfcb51806cab960301489c37e98e74a38f83a874d0ce0e57f5d8cc9052394',
        amt_sat: '1000'
      };

      const destBase64 = hexToUrlSafeBase64(mockRequest.dest);
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await lndClient.estimateRouteFee(mockRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/v2/router/route/estimatefee',
        {
          dest: destBase64,
          amt_sat: mockRequest.amt_sat
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include timeout parameter when provided', async () => {
      const mockResponse: RouteFeesResponse = {
        routing_fee_msat: '1000',
        time_lock_delay: 144
      };

      const mockRequest = {
        dest: '0369bbfcb51806cab960301489c37e98e74a38f83a874d0ce0e57f5d8cc9052394',
        amt_sat: '1000',
        timeout: 60
      };

      const destBase64 = hexToUrlSafeBase64(mockRequest.dest);
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await lndClient.estimateRouteFee(mockRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/v2/router/route/estimatefee',
        {
          dest: destBase64,
          amt_sat: mockRequest.amt_sat,
          timeout: mockRequest.timeout
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when estimating fees fails', async () => {
      const mockRequest = {
        dest: '0369bbfcb51806cab960301489c37e98e74a38f83a874d0ce0e57f5d8cc9052394',
        amt_sat: '1000'
      };

      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValueOnce(error);
      mockedIsAxiosError.mockReturnValueOnce(true);

      await expect(lndClient.estimateRouteFee(mockRequest)).rejects.toThrow(
        'Failed to estimate route fees: Network error'
      );
    });
  });

  describe('sendPaymentV2', () => {
    const mockResponse: SendPaymentResponse = {
      payment_hash: 'abc123...',
      payment_preimage: 'def456...',
      payment_route: {
        total_time_lock: 40,
        total_fees: '1',
        total_amt: '100001',
        hops: [],
      },
      payment_error: '',
      failure_reason: '',
      status: 'SUCCEEDED',
      fee_sat: '1',
      fee_msat: '1000',
      value_sat: '100000',
      value_msat: '100000000',
      creation_time_ns: '1650000000000000000',
      htlcs: [],
    };

    const mockRequest: SendPaymentRequest = {
      payment_request: 'lnbc1...',
      fee_limit_sat: '10',
    };

    it('should send a payment', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await lndClient.sendPaymentV2(mockRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith('/v2/router/send', mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when sending payment', async () => {
      const error = new Error('Payment failed');
      mockedAxios.post.mockRejectedValueOnce(error);
      mockedIsAxiosError.mockReturnValueOnce(true);

      await expect(lndClient.sendPaymentV2(mockRequest)).rejects.toThrow('Failed to send payment');
    });
  });

  describe('Streaming functionality', () => {
    let mockWs: any; // Using any to avoid TypeScript errors with mocking

    beforeEach(() => {
      // Create a mock WebSocket with necessary properties
      mockWs = new EventEmitter();
      mockWs.close = jest.fn();
      Object.defineProperty(mockWs, 'readyState', {
        get: jest.fn().mockReturnValue(WebSocket.OPEN),
        configurable: true
      });

      // Make the WebSocket constructor return our mock
      MockedWebSocket.mockImplementation(() => mockWs);
    });

    describe('subscribeInvoices', () => {
      it('should create a WebSocket connection for invoice subscription', () => {
        // Call the method
        const url = lndClient.subscribeInvoices();

        // Verify WebSocket creation
        expect(MockedWebSocket).toHaveBeenCalledWith(
          'wss://test-lnd-node:8080/v1/invoices/subscribe',
          { headers: { 'Grpc-Metadata-macaroon': 'test-macaroon-hex' } }
        );

        // Verify the returned URL
        expect(url).toBe('https://test-lnd-node:8080/v1/invoices/subscribe');
      });

      it('should emit invoice events when messages are received', () => {
        // Setup a spy on the emit method
        const emitSpy = jest.spyOn(lndClient, 'emit');

        // Call the method to set up the WebSocket
        lndClient.subscribeInvoices();

        // Create a mock invoice object
        const mockInvoice: Invoice = {
          r_hash: 'test-hash',
          state: 'OPEN',
          memo: 'Test invoice',
          value: '1000',
          settled: false,
        } as Invoice;

        // Simulate the message event
        mockWs.emit('message', JSON.stringify(mockInvoice));

        // Verify that the invoice event was emitted
        expect(emitSpy).toHaveBeenCalledWith('invoice', mockInvoice);
      });
    });

    describe('subscribeSingleInvoice', () => {
      it('should create a WebSocket connection for a specific invoice', () => {
        // Call the method with a hex payment hash
        const paymentHash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
        const url = lndClient.subscribeSingleInvoice(paymentHash);

        // Verify WebSocket creation with URL-safe base64 conversion
        expect(MockedWebSocket).toHaveBeenCalledWith(
          expect.stringContaining('/v2/invoices/subscribe/'),
          expect.anything()
        );

        // Verify the returned URL
        expect(url).toContain('/v2/invoices/subscribe/');
      });
    });

    describe('trackPaymentV2', () => {
      it('should create a WebSocket connection for tracking all payments', () => {
        // Call the method
        const url = lndClient.trackPaymentV2();

        // Verify WebSocket creation
        expect(MockedWebSocket).toHaveBeenCalledWith(
          'wss://test-lnd-node:8080/v2/router/trackpayments?no_inflight_updates=false',
          expect.anything()
        );

        // Verify the returned URL
        expect(url).toBe('https://test-lnd-node:8080/v2/router/trackpayments?no_inflight_updates=false');
      });

      it('should emit payment update events when messages are received', () => {
        // Setup a spy on the emit method
        const emitSpy = jest.spyOn(lndClient, 'emit');

        // Call the method to set up the WebSocket
        lndClient.trackPaymentV2();

        // Create a mock payment update
        const mockPayment = {
          payment_hash: 'test-payment-hash',
          status: 'SUCCEEDED',
          value_sat: '1000',
          fee_sat: '1',
        };

        // Simulate receiving a message
        mockWs.emit('message', JSON.stringify(mockPayment));

        // Verify that the payment update event was emitted
        expect(emitSpy).toHaveBeenCalledWith('paymentUpdate', mockPayment);
      });
    });

    describe('Connection management', () => {
      it('should close a specific connection', () => {
        // First create a connection
        const url = lndClient.subscribeInvoices();

        // Then close it
        lndClient.closeConnection(url);

        // Verify WebSocket close was called
        expect(mockWs.close).toHaveBeenCalled();
      });

      it('should close all connections', () => {
        // Create multiple connections
        lndClient.subscribeInvoices();
        lndClient.trackPaymentV2();

        // Close all connections
        lndClient.closeAllConnections();

        // Verify WebSocket close was called
        expect(mockWs.close).toHaveBeenCalled();
      });

      it('should check if a connection is active', () => {
        // Create a connection
        const url = lndClient.subscribeInvoices();

        // Mock the readyState getter
        jest.spyOn(mockWs, 'readyState', 'get').mockReturnValue(WebSocket.OPEN);

        // Check if the connection is active
        const isActive = lndClient.isConnectionActive(url);

        // Verify that it returns true
        expect(isActive).toBe(true);
      });

      it('should get the status of a connection', () => {
        // Create a connection
        const url = lndClient.subscribeInvoices();

        // Mock the readyState getter
        jest.spyOn(mockWs, 'readyState', 'get').mockReturnValue(WebSocket.OPEN);

        // Get the connection status
        const status = lndClient.getConnectionStatus(url);

        // Verify the status
        expect(status).toBe('OPEN');
      });
    });
  });
}); 