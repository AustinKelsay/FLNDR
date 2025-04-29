import { LndClient } from '../../services/lndClient';
import WebSocket from 'ws';

// Create a proper mock for WebSocket that works with Jest spying
const mockClose = jest.fn();
const mockOn = jest.fn();
const mockAddEventListener = jest.fn();

// Create a mock implementation of WebSocket
jest.mock('ws', () => {
  return jest.fn().mockImplementation(() => {
    return {
      close: mockClose,
      on: mockOn,
      addEventListener: mockAddEventListener,
      readyState: 1, // WebSocket.OPEN
    };
  });
});

// Manually add the WebSocket static constants for tests
(WebSocket as any).CONNECTING = 0;
(WebSocket as any).OPEN = 1;
(WebSocket as any).CLOSING = 2;
(WebSocket as any).CLOSED = 3;

describe('LndClient Streaming', () => {
  let lndClient: LndClient;
  const mockBaseUrl = 'http://localhost:8080';
  const mockMacaroon = 'mock-macaroon-value';
  
  beforeEach(() => {
    jest.clearAllMocks();
    lndClient = new LndClient({
      baseUrl: mockBaseUrl,
      macaroon: mockMacaroon
    });
  });
  
  describe('subscribeInvoices', () => {
    it('should create a WebSocket connection to the invoices endpoint', () => {
      lndClient.subscribeInvoices();
      
      expect(WebSocket).toHaveBeenCalledWith(
        'ws://localhost:8080/v1/invoices/subscribe',
        expect.objectContaining({
          headers: {
            'Grpc-Metadata-macaroon': mockMacaroon
          }
        })
      );
    });
    
    it('should return the subscription URL', () => {
      const url = lndClient.subscribeInvoices();
      expect(url).toBe(`${mockBaseUrl}/v1/invoices/subscribe`);
    });
  });
  
  describe('subscribeSingleInvoice', () => {
    it('should create a WebSocket connection to the single invoice endpoint', () => {
      const mockPaymentHash = 'payment-hash';
      lndClient.subscribeSingleInvoice(mockPaymentHash);
      
      expect(WebSocket).toHaveBeenCalledWith(
        expect.stringContaining(`ws://localhost:8080/v2/invoices/subscribe/`),
        expect.objectContaining({
          headers: {
            'Grpc-Metadata-macaroon': mockMacaroon
          }
        })
      );
    });
  });
  
  describe('trackPaymentByHash', () => {
    it('should create a WebSocket connection to track a payment', () => {
      const mockPaymentHash = 'payment-hash';
      lndClient.trackPaymentByHash(mockPaymentHash);
      
      expect(WebSocket).toHaveBeenCalledWith(
        expect.stringContaining(`ws://localhost:8080/v2/router/track/`),
        expect.objectContaining({
          headers: {
            'Grpc-Metadata-macaroon': mockMacaroon
          }
        })
      );
    });
  });
  
  describe('trackPaymentV2', () => {
    it('should create a WebSocket connection to track all payments', () => {
      lndClient.trackPaymentV2();
      
      expect(WebSocket).toHaveBeenCalledWith(
        'ws://localhost:8080/v2/router/trackpayments?no_inflight_updates=false',
        expect.objectContaining({
          headers: {
            'Grpc-Metadata-macaroon': mockMacaroon
          }
        })
      );
    });
    
    it('should add no_inflight_updates parameter when true', () => {
      lndClient.trackPaymentV2(true);
      
      expect(WebSocket).toHaveBeenCalledWith(
        'ws://localhost:8080/v2/router/trackpayments?no_inflight_updates=true',
        expect.objectContaining({
          headers: {
            'Grpc-Metadata-macaroon': mockMacaroon
          }
        })
      );
    });
  });
  
  describe('closeConnection', () => {
    it('should close a specific connection by URL', () => {
      // Create a connection
      const url = lndClient.subscribeInvoices();
      
      // Close it
      lndClient.closeConnection(url);
      
      // Verify close was called
      expect(mockClose).toHaveBeenCalled();
    });
  });
  
  describe('closeAllConnections', () => {
    it('should close all active connections', () => {
      // Create multiple connections
      lndClient.subscribeInvoices();
      lndClient.trackPaymentV2();
      
      // Close all connections
      lndClient.closeAllConnections();
      
      // Verify all close methods were called - mockClose is called twice
      expect(mockClose).toHaveBeenCalledTimes(2);
    });
  });
}); 