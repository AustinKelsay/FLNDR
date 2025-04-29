import axios, { AxiosError, AxiosInstance } from 'axios';
import { LndClient } from '../../services/lndClient';
import { AddInvoiceResponse, Invoice, ListInvoicesResponse } from '../../types/lnd';

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
  };
  
  return {
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn(),
  };
});

// Get the mocked instances
const mockedAxios = axios.create() as jest.Mocked<AxiosInstance>;

// Cast the mocked function with proper typing
const mockedIsAxiosError = axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>;

describe('LndClient - Invoice Methods', () => {
  let lndClient: LndClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new LndClient instance for each test
    lndClient = new LndClient({
      baseUrl: 'https://test-lnd-node:8080',
      macaroon: 'test-macaroon-hex',
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
}); 