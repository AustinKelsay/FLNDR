import axios from 'axios';
import { LndClient } from '../../services/lndClient';
import {
  GetInfoResponse,
  ChannelBalanceResponse,
  AddInvoiceResponse,
  Invoice,
  ListPaymentsResponse,
  ListInvoicesResponse
} from '../../types/lnd';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LndClient', () => {
  let lndClient: LndClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mocked axios instance
    mockedAxios.create.mockReturnValue(mockedAxios);
    
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
      // Setup axios mock to reject
      const error = new Error('Request failed with status code 500');
      (error as any).isAxiosError = true;
      mockedAxios.get.mockRejectedValueOnce(error);
      
      // Test that it throws an error containing our expected message
      try {
        await lndClient.getInfo();
        // If we get here, the test should fail
        fail('Expected getInfo to throw an error');
      } catch (e) {
        expect((e as Error).message).toContain('Failed to get LND info: Request failed with status code 500');
      }
    });
  });
  
  describe('channelBalance', () => {
    it('should return channel balance', async () => {
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
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });
      
      // Execute the method
      const result = await lndClient.channelBalance();
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/v1/channels/balance');
      expect(result).toEqual(mockResponse);
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
    it('should return invoice details', async () => {
      // Mock response data
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
      
      // Setup axios mock
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });
      
      // Execute the method
      const rHashStr = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
      const result = await lndClient.lookupInvoiceV2(rHashStr);
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(`/v2/invoices/lookup?payment_hash=${rHashStr}`);
      expect(result).toEqual(mockResponse);
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
}); 