import { LndClient } from '../services/lndClient';
import WebSocket from 'ws';

// Mock WebSocket to avoid actual connections during tests
jest.mock('ws');

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
    
    // Mock the WebSocket implementation
    (WebSocket as jest.MockedClass<typeof WebSocket>).mockImplementation(() => {
      const mockWs = {
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as WebSocket;
      return mockWs;
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
  
  describe('trackPayments', () => {
    it('should create a WebSocket connection to track a payment', () => {
      const mockPaymentHash = 'payment-hash';
      lndClient.trackPayments(mockPaymentHash);
      
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
      // Set up mock WebSocket
      const mockWs = {
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as WebSocket;
      (WebSocket as jest.MockedClass<typeof WebSocket>).mockImplementationOnce(() => mockWs);
      
      // Create a connection
      const url = lndClient.subscribeInvoices();
      
      // Close it
      lndClient.closeConnection(url);
      
      // Verify close was called
      expect(mockWs.close).toHaveBeenCalled();
    });
  });
  
  describe('closeAllConnections', () => {
    it('should close all active connections', () => {
      // Set up multiple mock WebSockets
      const mockWs1 = {
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as WebSocket;
      const mockWs2 = {
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as WebSocket;
      
      (WebSocket as jest.MockedClass<typeof WebSocket>)
        .mockImplementationOnce(() => mockWs1)
        .mockImplementationOnce(() => mockWs2);
      
      // Create multiple connections
      lndClient.subscribeInvoices();
      lndClient.trackPaymentV2();
      
      // Close all connections
      lndClient.closeAllConnections();
      
      // Verify all close methods were called
      expect(mockWs1.close).toHaveBeenCalled();
      expect(mockWs2.close).toHaveBeenCalled();
    });
  });
}); 