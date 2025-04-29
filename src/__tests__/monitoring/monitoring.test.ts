import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { LndClient } from '../../services/lndClient';
import { Invoice } from '../../types/lnd';

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

describe('LndClient - Monitoring Methods', () => {
  let lndClient: LndClient;
  let mockWs: any; // Using any to avoid TypeScript errors with mocking
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new LndClient instance for each test
    lndClient = new LndClient({
      baseUrl: 'https://test-lnd-node:8080',
      macaroon: 'test-macaroon-hex',
    });

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
  
  describe('subscribeInvoices', () => {
    it('should create a WebSocket connection for invoice subscription', () => {
      // Call the method
      const url = lndClient.subscribeInvoices();

      // Verify WebSocket creation
      expect(WebSocket).toHaveBeenCalledWith(
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
      mockWs.emit('message', { data: JSON.stringify(mockInvoice) });

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
      expect(WebSocket).toHaveBeenCalledWith(
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
      expect(WebSocket).toHaveBeenCalledWith(
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
      mockWs.emit('message', { data: JSON.stringify(mockPayment) });

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