import { LndClient } from '../../services/lndClient';
import axios from 'axios';
import { Payment, Invoice, ListPaymentsResponse, ListInvoicesResponse } from '../../types/lnd';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LndClient - Transaction History', () => {
  let lndClient: LndClient;
  let mockAxiosInstance: jest.Mocked<typeof axios>;

  beforeEach(() => {
    // Create a mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      create: jest.fn(),
      // Add other methods as needed
    } as any;

    // Mock the axios create to return our mock instance
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create a new client instance before each test
    lndClient = new LndClient({
      baseUrl: 'https://localhost:8080',
      macaroon: 'mock-macaroon'
    });

    // Reset axios mocks
    jest.clearAllMocks();
  });

  // Helper to create a mock payment
  const createMockPayment = (id: string, status: 'SUCCEEDED' | 'FAILED' | 'IN_FLIGHT', amount: string, timestamp: string): Payment => {
    return {
      payment_hash: id,
      value: amount,
      value_sat: amount,
      value_msat: `${parseInt(amount) * 1000}`,
      creation_date: timestamp,
      fee: '10',
      fee_sat: '10',
      fee_msat: '10000',
      payment_preimage: `preimage-${id}`,
      status,
      payment_request: `lnbc${amount}xyz`,
      creation_time_ns: `${parseInt(timestamp) * 1000000}`,
      htlcs: [],
      path: [`dest-node-${id}`],
      failure_reason: status === 'FAILED' ? 'FAILURE_REASON_TIMEOUT' : 'FAILURE_REASON_NONE'
    } as Payment;
  };

  // Helper to create a mock invoice
  const createMockInvoice = (id: string, state: 'OPEN' | 'SETTLED' | 'CANCELED' | 'ACCEPTED', settled: boolean, amount: string, timestamp: string): Invoice => {
    return {
      r_hash: id,
      value: amount,
      value_msat: `${parseInt(amount) * 1000}`,
      settled,
      state,
      creation_date: timestamp,
      memo: `Invoice ${id}`,
      r_preimage: `preimage-${id}`,
      payment_request: `lnbc${amount}abcdef`,
      expiry: '3600',
      add_index: '1',
      settle_index: settled ? '1' : '0',
      settle_date: settled ? `${parseInt(timestamp) + 100}` : '0',
      amt_paid: settled ? amount : '0',
      amt_paid_sat: settled ? amount : '0',
      amt_paid_msat: settled ? `${parseInt(amount) * 1000}` : '0',
      private: false,
      is_keysend: false,
      is_amp: false,
      payment_addr: '',
      description_hash: '',
      fallback_addr: '',
      cltv_expiry: '',
      route_hints: [],
      features: {},
      htlcs: []
    } as Invoice;
  };

  it('should combine payments and invoices into a unified list', async () => {
    // Mock list payments response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          payments: [
            createMockPayment('p1', 'SUCCEEDED', '10000', '1617753600'), // April 7, 2021
            createMockPayment('p2', 'FAILED', '20000', '1617840000'),    // April 8, 2021
          ],
          first_index_offset: '0',
          last_index_offset: '2'
        } as ListPaymentsResponse
      })
    );

    // Mock list invoices response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          invoices: [
            createMockInvoice('i1', 'SETTLED', true, '15000', '1617926400'),   // April 9, 2021
            createMockInvoice('i2', 'OPEN', false, '25000', '1618012800'),     // April 10, 2021
          ],
          first_index_offset: '0',
          last_index_offset: '2'
        } as ListInvoicesResponse
      })
    );

    // Call the method
    const result = await lndClient.listTransactionHistory();
    
    // Verify combined results (newest first by default)
    expect(result.transactions).toHaveLength(4);
    expect(result.transactions[0].id).toBe('i2');          // Newest
    expect(result.transactions[1].id).toBe('i1');
    expect(result.transactions[2].id).toBe('p2');
    expect(result.transactions[3].id).toBe('p1');          // Oldest
    
    // Check pagination metadata
    expect(result.total_count).toBe(4);
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
    expect(result.has_more).toBe(false);
    
    // Verify the correct parameters were passed to the API calls
    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    
    // Check payments API call parameters
    const paymentsCall = mockAxiosInstance.get.mock.calls[0][0];
    expect(paymentsCall).toContain('/v1/payments');
    expect(paymentsCall).toContain('include_incomplete=true');
    expect(paymentsCall).toContain('max_payments=100');
    expect(paymentsCall).toContain('reversed=true');
    
    // Check invoices API call parameters
    const invoicesCall = mockAxiosInstance.get.mock.calls[1][0];
    expect(invoicesCall).toContain('/v1/invoices');
    expect(invoicesCall).toContain('pending_only=false');
    expect(invoicesCall).toContain('num_max_invoices=100');
    expect(invoicesCall).toContain('reversed=true');
  });

  it('should filter transactions by type', async () => {
    // Mock list payments response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          payments: [
            createMockPayment('p1', 'SUCCEEDED', '10000', '1617753600'),
            createMockPayment('p2', 'FAILED', '20000', '1617840000'),
          ],
          first_index_offset: '0',
          last_index_offset: '2'
        } as ListPaymentsResponse
      })
    );

    // Filter for sent transactions only
    const sentOnly = await lndClient.listTransactionHistory({
      types: ['sent']
    });
    
    expect(sentOnly.transactions).toHaveLength(2);
    expect(sentOnly.transactions[0].type).toBe('sent');
    expect(sentOnly.transactions[1].type).toBe('sent');
    
    // Verify we only called the payments API for 'sent' transactions
    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    expect(mockAxiosInstance.get.mock.calls[0][0]).toContain('/v1/payments');
    
    // Reset mocks for the next test
    jest.clearAllMocks();
    
    // Mock list invoices response for 'received' type filter
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          invoices: [
            createMockInvoice('i1', 'SETTLED', true, '15000', '1617926400'),
            createMockInvoice('i2', 'OPEN', false, '25000', '1618012800'),
          ],
          first_index_offset: '0',
          last_index_offset: '2'
        } as ListInvoicesResponse
      })
    );
    
    // Filter for received transactions only
    const receivedOnly = await lndClient.listTransactionHistory({
      types: ['received']
    });
    
    expect(receivedOnly.transactions).toHaveLength(2);
    expect(receivedOnly.transactions[0].type).toBe('received');
    expect(receivedOnly.transactions[1].type).toBe('received');
    
    // Verify we only called the invoices API for 'received' transactions
    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    expect(mockAxiosInstance.get.mock.calls[0][0]).toContain('/v1/invoices');
  });

  it('should filter transactions by status', async () => {
    // Mock list payments response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          payments: [
            createMockPayment('p1', 'SUCCEEDED', '10000', '1617753600'),
            createMockPayment('p2', 'FAILED', '20000', '1617840000'),
          ],
          first_index_offset: '0',
          last_index_offset: '2'
        } as ListPaymentsResponse
      })
    );

    // Mock list invoices response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          invoices: [
            createMockInvoice('i1', 'SETTLED', true, '15000', '1617926400'),
            createMockInvoice('i2', 'OPEN', false, '25000', '1618012800'),
          ],
          first_index_offset: '0',
          last_index_offset: '2'
        } as ListInvoicesResponse
      })
    );

    // Filter for successful transactions only
    const successOnly = await lndClient.listTransactionHistory({
      statuses: ['succeeded', 'settled']
    });
    
    expect(successOnly.transactions).toHaveLength(2);
    expect(successOnly.transactions[0].status === 'settled' || 
           successOnly.transactions[0].status === 'succeeded').toBeTruthy();
    expect(successOnly.transactions[1].status === 'settled' || 
           successOnly.transactions[1].status === 'succeeded').toBeTruthy();
  });

  it('should filter transactions by date range', async () => {
    // Mock list payments response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          payments: [
            createMockPayment('p1', 'SUCCEEDED', '10000', '1617753600'), // April 7, 2021
            createMockPayment('p2', 'FAILED', '20000', '1617840000'),    // April 8, 2021
            createMockPayment('p3', 'IN_FLIGHT', '30000', '1617926400'), // April 9, 2021
          ],
          first_index_offset: '0',
          last_index_offset: '3'
        } as ListPaymentsResponse
      })
    );

    // Mock list invoices response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          invoices: [
            createMockInvoice('i1', 'SETTLED', true, '15000', '1618012800'),   // April 10, 2021
            createMockInvoice('i2', 'OPEN', false, '25000', '1618099200'),     // April 11, 2021
          ],
          first_index_offset: '0',
          last_index_offset: '2'
        } as ListInvoicesResponse
      })
    );

    // Filter by date range: April 8-10, 2021
    const dateFiltered = await lndClient.listTransactionHistory({
      creation_date_start: '1617840000', // April 8, 2021
      creation_date_end: '1618012800'    // April 10, 2021 (inclusive)
    });
    
    // Don't assert on length since the filtering happens at the API level
    // and we're just checking that the correct parameters are passed
    
    // Verify the correct date parameters were passed to the API
    expect(mockAxiosInstance.get.mock.calls[0][0]).toContain('creation_date_start=1617840000');
    expect(mockAxiosInstance.get.mock.calls[0][0]).toContain('creation_date_end=1618012800');
    expect(mockAxiosInstance.get.mock.calls[1][0]).toContain('creation_date_start=1617840000');
    expect(mockAxiosInstance.get.mock.calls[1][0]).toContain('creation_date_end=1618012800');
    
    // Make sure we get some transactions back
    expect(dateFiltered.transactions.length).toBeGreaterThan(0);
  });

  it('should apply pagination', async () => {
    // Create mock data with more items
    const payments = [
      createMockPayment('p1', 'SUCCEEDED', '10000', '1617753600'),
      createMockPayment('p2', 'FAILED', '20000', '1617840000'),
      createMockPayment('p3', 'IN_FLIGHT', '30000', '1617926400'),
    ];
    
    const invoices = [
      createMockInvoice('i1', 'SETTLED', true, '15000', '1618012800'),
      createMockInvoice('i2', 'OPEN', false, '25000', '1618099200'),
      createMockInvoice('i3', 'ACCEPTED', false, '35000', '1618185600'),
    ];

    // Mock list payments response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          payments,
          first_index_offset: '0',
          last_index_offset: '3'
        } as ListPaymentsResponse
      })
    );

    // Mock list invoices response
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          invoices,
          first_index_offset: '0',
          last_index_offset: '3'
        } as ListInvoicesResponse
      })
    );

    // Get first page with 2 items
    const firstPage = await lndClient.listTransactionHistory({
      limit: 2,
      offset: 0
    });
    
    expect(firstPage.transactions).toHaveLength(2);
    expect(firstPage.limit).toBe(2);
    expect(firstPage.offset).toBe(0);
    expect(firstPage.has_more).toBe(true);
    expect(firstPage.total_count).toBe(6); // Total of 6 transactions (3 payments + 3 invoices)
    
    // Each page will re-fetch all data from the APIs, so we need to mock responses again
    // Mock for second page
    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          payments,
          first_index_offset: '0',
          last_index_offset: '3'
        } as ListPaymentsResponse
      })
    );

    mockAxiosInstance.get.mockImplementationOnce(() => 
      Promise.resolve({
        data: {
          invoices,
          first_index_offset: '0',
          last_index_offset: '3'
        } as ListInvoicesResponse
      })
    );
    
    // Get second page
    const secondPage = await lndClient.listTransactionHistory({
      limit: 2,
      offset: 2
    });
    
    expect(secondPage.transactions).toHaveLength(2);
    expect(secondPage.limit).toBe(2);
    expect(secondPage.offset).toBe(2);
    expect(secondPage.has_more).toBe(true);
    
    // Make sure we're getting different items on different pages
    expect(secondPage.transactions[0].id).not.toBe(firstPage.transactions[0].id);
    expect(secondPage.transactions[1].id).not.toBe(firstPage.transactions[1].id);
  });

  // Test error handling with the actual implementation behavior
  it('should throw an error when any API call fails', async () => {
    // Save and mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    try {
      // Scenario 1: Payments API fails
      mockAxiosInstance.get.mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );
      
      // Should throw an error even though only one API fails
      await expect(lndClient.listTransactionHistory()).rejects
        .toThrow('Failed to fetch transaction history from LND');
      
      // Reset mocks for next scenario
      jest.clearAllMocks();
      mockAxiosInstance.get.mockReset();
      
      // Scenario 2: Both APIs fail
      mockAxiosInstance.get.mockImplementation(() => 
        Promise.reject(new Error('Network error'))
      );
      
      // Should throw an error when both APIs fail
      await expect(lndClient.listTransactionHistory()).rejects
        .toThrow('Failed to fetch transaction history from LND');
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });
}); 