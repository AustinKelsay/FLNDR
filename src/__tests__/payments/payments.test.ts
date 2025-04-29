import axios, { AxiosError, AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { LndClient } from '../../services/lndClient';
import { hexToUrlSafeBase64 } from '../../utils/base64Utils';
import {
  ListPaymentsResponse,
  DecodedPaymentRequest,
  RouteFeesResponse,
  SendPaymentResponse,
  SendPaymentRequest
} from '../../types/lnd';

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

// Mock WebSocket
jest.mock('ws');

// Get the mocked instances
const mockedAxios = axios.create() as jest.Mocked<AxiosInstance>;

// Cast the mocked function with proper typing
const mockedIsAxiosError = axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>;

describe('LndClient - Payment Methods', () => {
  let lndClient: LndClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new LndClient instance for each test
    lndClient = new LndClient({
      baseUrl: 'https://test-lnd-node:8080',
      macaroon: 'test-macaroon-hex',
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
          amt_sat: mockRequest.amt_sat,
          timeout: 60 // Default timeout value
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

    it('should send a payment in standard mode', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await lndClient.sendPaymentV2(mockRequest);

      // Check that the timeout_seconds was added with default value
      expect(mockedAxios.post).toHaveBeenCalledWith('/v2/router/send', {
        ...mockRequest,
        timeout_seconds: "60"
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when sending payment', async () => {
      const error = new Error('Payment failed');
      mockedAxios.post.mockRejectedValueOnce(error);
      mockedIsAxiosError.mockReturnValueOnce(true);

      await expect(lndClient.sendPaymentV2(mockRequest)).rejects.toThrow('Failed to send payment');
    });

    it('should use streaming mode when streaming option is true', async () => {
      // Setup mocks
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { ...mockResponse, payment_hash: 'test-payment-hash' } 
      });
      
      // Setup spy for trackPaymentByHash which gets called in streaming mode
      const trackSpy = jest.spyOn(lndClient, 'trackPaymentByHash').mockReturnValue('mock-connection-url');
      
      // Call with streaming=true
      const streamingRequest = {
        ...mockRequest,
        streaming: true
      };
      
      const result = await lndClient.sendPaymentV2(streamingRequest);
      
      // Should call post first to send payment
      expect(mockedAxios.post).toHaveBeenCalledWith('/v2/router/send', {
        payment_request: 'lnbc1...',
        fee_limit_sat: '10',
        timeout_seconds: "60"
      });
      
      // Verify 'streaming' parameter was not included in the API request
      expect(mockedAxios.post).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ streaming: true })
      );
      
      // Should call trackPaymentByHash with the payment hash
      expect(trackSpy).toHaveBeenCalledWith('test-payment-hash');
      
      // Should return the connection URL
      expect(result).toBe('mock-connection-url');
    });
  });

  describe('trackPaymentByHash', () => {
    let mockWs: any;

    beforeEach(() => {
      // Create a mock WebSocket with necessary properties
      mockWs = new EventEmitter();
      mockWs.close = jest.fn();
      Object.defineProperty(mockWs, 'readyState', {
        get: jest.fn().mockReturnValue(WebSocket.OPEN),
        configurable: true
      });

      // Get the WebSocket constructor mock and set its return value
      const WsModule = jest.requireMock('ws');
      WsModule.WebSocket.mockReturnValue(mockWs);
    });

    it('should create a WebSocket connection for tracking a specific payment', () => {
      // Call the method with a hex payment hash
      const paymentHash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
      const url = lndClient.trackPaymentByHash(paymentHash);

      // Verify WebSocket creation with the correct path
      expect(WebSocket).toHaveBeenCalledWith(
        `wss://test-lnd-node:8080/v2/router/track/${paymentHash}`,
        expect.anything()
      );

      // Verify the returned URL matches
      expect(url).toBe(`https://test-lnd-node:8080/v2/router/track/${paymentHash}`);
    });

    it('should handle 0x prefixed payment hashes', () => {
      // Call with 0x prefix
      const paymentHash = '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
      const url = lndClient.trackPaymentByHash(paymentHash);
      
      // Should strip the 0x prefix
      expect(WebSocket).toHaveBeenCalledWith(
        `wss://test-lnd-node:8080/v2/router/track/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`,
        expect.anything()
      );
    });

    it('should emit payment update events when messages are received', () => {
      // Setup a spy on the emit method
      const emitSpy = jest.spyOn(lndClient, 'emit');

      // Call the method to set up the WebSocket
      const paymentHash = 'test-payment-hash';
      lndClient.trackPaymentByHash(paymentHash);

      // Create a mock payment update
      const mockPayment = {
        payment_hash: paymentHash,
        status: 'SUCCEEDED',
        value_sat: '1000',
        fee_sat: '1',
      };

      // Simulate receiving a message
      mockWs.emit('message', { data: JSON.stringify(mockPayment) });

      // Verify that the payment update event was emitted
      expect(emitSpy).toHaveBeenCalledWith('paymentUpdate', mockPayment);
    });
  });
}); 