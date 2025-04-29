import axios, { AxiosError, AxiosInstance } from 'axios';
import { LndClient } from '../../services/lndClient';
import { GetInfoResponse, ChannelBalanceResponse } from '../../types/lnd';

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

describe('LndClient - Info Methods', () => {
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
}); 