import axios, { AxiosInstance } from 'axios';
import { LndClient } from '../../services/lndClient';

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

describe('LndClient - Custom Methods', () => {
  let lndClient: LndClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new LndClient instance for each test
    lndClient = new LndClient({
      baseUrl: 'https://test-lnd-node:8080',
      macaroon: 'test-macaroon-hex',
    });

    // Spy on console.warn to test warning message for fetchAll
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  describe('listTransactionHistory', () => {
    // Mock response data for payments
    const mockPaymentResponse = {
      payments: [{
        payment_hash: 'payment-hash-1',
        value: '100000',
        creation_date: '1650000000',
        fee: '100',
        payment_preimage: 'preimage-1',
        value_sat: '100000',
        value_msat: '100000000',
        payment_request: 'lnbc10u1p0nk97app...',
        status: 'SUCCEEDED',
        fee_sat: '100',
        fee_msat: '100000',
        creation_time_ns: '1650000000000000000',
        htlcs: [],
        path: [],
      }],
      first_index_offset: '1',
      last_index_offset: '2',
    };

    // Mock response data for invoices
    const mockInvoiceResponse = {
      invoices: [{
        memo: 'Test invoice',
        r_preimage: 'invoice-preimage-1',
        r_hash: 'invoice-hash-1',
        value: '50000',
        value_msat: '50000000',
        settled: true,
        creation_date: '1650000100',
        settle_date: '1650000200',
        payment_request: 'lnbc5u1p0nk97app...',
        state: 'SETTLED',
        add_index: '10',
        settle_index: '1',
      }],
      first_index_offset: '10',
      last_index_offset: '11',
    };

    it('should fetch transactions with batch size optimization', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/v1/payments')) {
          return Promise.resolve({ data: mockPaymentResponse });
        } else if (url.includes('/v1/invoices')) {
          return Promise.resolve({ data: mockInvoiceResponse });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const result = await lndClient.listTransactionHistory({ limit: 10 });
      
      // Verify we're using batch fetching by checking API call params
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      
      // Check we're requesting more items than the limit to optimize API calls
      // The implementation should request max(limit*2, 100)
      const paymentsUrl = mockedAxios.get.mock.calls.find(call => call[0].includes('/v1/payments'))?.[0];
      const invoicesUrl = mockedAxios.get.mock.calls.find(call => call[0].includes('/v1/invoices'))?.[0];
      
      expect(paymentsUrl).toContain('max_payments=100'); // Our min batch size is 100
      expect(invoicesUrl).toContain('num_max_invoices=100');
      
      // Verify the actual returned data
      expect(result.transactions.length).toBe(2);
      expect(result.has_more).toBe(false);
    });

    it('should support separate cursors for payments and invoices', async () => {
      // Setup mocks
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/v1/payments')) {
          // Make sure to include full response with all necessary fields to trigger has_more
          return Promise.resolve({ 
            data: {
              ...mockPaymentResponse,
              payments: Array(100).fill(mockPaymentResponse.payments[0]), // Fill with 100 items to trigger has_more
              last_index_offset: '100'
            } 
          });
        } else if (url.includes('/v1/invoices')) {
          return Promise.resolve({ 
            data: {
              ...mockInvoiceResponse,
              invoices: Array(100).fill(mockInvoiceResponse.invoices[0]), // Fill with 100 items to trigger has_more
              last_index_offset: '100'
            }
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Call with payment and invoice cursors
      const result = await lndClient.listTransactionHistory({
        limit: 10,
        payment_cursor: '5',
        invoice_cursor: '15'
      });
      
      // Verify cursors are used in API calls
      const paymentsUrl = mockedAxios.get.mock.calls.find(call => call[0].includes('/v1/payments'))?.[0];
      const invoicesUrl = mockedAxios.get.mock.calls.find(call => call[0].includes('/v1/invoices'))?.[0];
      
      expect(paymentsUrl).toContain('index_offset=5');
      expect(invoicesUrl).toContain('index_offset=15');
      
      // Check that next_cursor is present since we have more data
      expect(result.has_more).toBe(true);
      expect(result.next_cursor).toBeDefined();
      if (result.next_cursor) {
        expect(result.next_cursor.payment_cursor).toBe('100');
        expect(result.next_cursor.invoice_cursor).toBe('100');
      }
    });

    it('should warn when fetchAll is used with large datasets', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/v1/payments')) {
          return Promise.resolve({ data: mockPaymentResponse });
        } else if (url.includes('/v1/invoices')) {
          return Promise.resolve({ data: mockInvoiceResponse });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      await lndClient.listTransactionHistory({ fetchAll: true });
      
      // Check that a warning was issued
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('fetchAll=true can be inefficient for large datasets')
      );
      
      // Also verify batch size is larger when fetchAll is true
      const paymentsUrl = mockedAxios.get.mock.calls.find(call => call[0].includes('/v1/payments'))?.[0];
      expect(paymentsUrl).toContain('max_payments=1000');
    });

    it('should apply pagination to the merged and sorted list', async () => {
      // Create multiple payment and invoice records with enough records to trigger has_more
      const paymentsResponse = {
        payments: Array(100).fill({
          payment_hash: 'payment-hash-1',
          value_sat: '100000',
          creation_date: '1650000000', 
          fee_sat: '100',
          status: 'SUCCEEDED',
        }),
        last_index_offset: '100'
      };
      
      const invoicesResponse = {
        invoices: Array(100).fill({
          r_hash: 'invoice-hash-1',
          value: '50000',
          creation_date: '1650000025',
          settled: true,
          state: 'SETTLED',
        }),
        last_index_offset: '100'
      };
      
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/v1/payments')) {
          return Promise.resolve({ data: paymentsResponse });
        } else if (url.includes('/v1/invoices')) {
          return Promise.resolve({ data: invoicesResponse });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Request only 2 items even though there are many more available
      const result = await lndClient.listTransactionHistory({ limit: 2 });
      
      // Check we got the right number of transactions
      expect(result.transactions.length).toBe(2);
      
      // Check that the transactions are sorted by timestamp
      const timestamps = result.transactions.map(tx => tx.timestamp);
      if (timestamps.length > 1) {
        // Only verify order if we have multiple transactions
        expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1]);
      }
      
      // And we should have has_more indicator since we have plenty of transactions
      expect(result.has_more).toBe(true);
    });

    it('should support filtering by transaction type', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/v1/payments')) {
          return Promise.resolve({ data: mockPaymentResponse });
        } else if (url.includes('/v1/invoices')) {
          return Promise.resolve({ data: mockInvoiceResponse });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Request only sent (payment) transactions
      const sentOnly = await lndClient.listTransactionHistory({ 
        types: ['sent'] 
      });
      
      // Check we only called payments API
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get.mock.calls[0][0]).toContain('/v1/payments');
      
      // And we only got sent transactions
      expect(sentOnly.transactions.length).toBe(1);
      expect(sentOnly.transactions[0].type).toBe('sent');
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Request only received (invoice) transactions
      const receivedOnly = await lndClient.listTransactionHistory({ 
        types: ['received'] 
      });
      
      // Check we only called invoices API
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get.mock.calls[0][0]).toContain('/v1/invoices');
      
      // And we only got received transactions
      expect(receivedOnly.transactions.length).toBe(1);
      expect(receivedOnly.transactions[0].type).toBe('received');
    });

    it('should handle date range filtering', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/v1/payments')) {
          return Promise.resolve({ data: mockPaymentResponse });
        } else if (url.includes('/v1/invoices')) {
          return Promise.resolve({ data: mockInvoiceResponse });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const startDate = '1649000000';
      const endDate = '1651000000';
      
      await lndClient.listTransactionHistory({
        creation_date_start: startDate,
        creation_date_end: endDate
      });
      
      // Check date params are passed to both APIs
      const paymentsUrl = mockedAxios.get.mock.calls.find(call => call[0].includes('/v1/payments'))?.[0];
      const invoicesUrl = mockedAxios.get.mock.calls.find(call => call[0].includes('/v1/invoices'))?.[0];
      
      expect(paymentsUrl).toContain(`creation_date_start=${startDate}`);
      expect(paymentsUrl).toContain(`creation_date_end=${endDate}`);
      expect(invoicesUrl).toContain(`creation_date_start=${startDate}`);
      expect(invoicesUrl).toContain(`creation_date_end=${endDate}`);
    });
  });
}); 