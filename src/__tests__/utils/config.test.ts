import { getLndConfig, getLndConfigWithFallback } from '../../utils/config';
import { BitcoinNetwork } from '../../types/lnd';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn((path: string) => {
    if (path === '/valid/macaroon/path') {
      return Buffer.from('01020304', 'hex');
    }
    if (path === '/valid/tls/path') {
      return 'mock-tls-cert-content';
    }
    throw new Error(`File not found: ${path}`);
  }),
  existsSync: jest.fn((path: string) => {
    return path === '/valid/macaroon/path' || path === '/valid/tls/path';
  }),
}));

// Store original environment
const originalEnv = { ...process.env };

describe('LND Configuration Utilities', () => {
  // Reset environment variables before each test
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    
    // Silence console warnings for tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  // Restore environment after tests
  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getLndConfig', () => {
    it('should load configuration from environment variables using macaroon path', () => {
      // Set environment variables
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      process.env.LND_MACAROON_PATH = '/valid/macaroon/path';
      
      const config = getLndConfig();
      
      expect(config).toEqual({
        baseUrl: 'https://test-lnd:8080',
        macaroon: '01020304',
        network: undefined
      });
    });

    it('should use hex-encoded macaroon directly when provided', () => {
      // Set environment variables
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      process.env.LND_MACAROON = 'abcdef1234567890';
      
      const config = getLndConfig();
      
      expect(config).toEqual({
        baseUrl: 'https://test-lnd:8080',
        macaroon: 'abcdef1234567890',
        network: undefined
      });
    });

    it('should include TLS cert when path is provided', () => {
      // Set environment variables
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      process.env.LND_MACAROON_PATH = '/valid/macaroon/path';
      process.env.LND_TLS_CERT_PATH = '/valid/tls/path';
      
      const config = getLndConfig();
      
      expect(config).toEqual({
        baseUrl: 'https://test-lnd:8080',
        macaroon: '01020304',
        tlsCert: 'mock-tls-cert-content',
        network: undefined
      });
    });

    it('should use TLS cert content directly when provided', () => {
      // Set environment variables
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      process.env.LND_MACAROON_PATH = '/valid/macaroon/path';
      process.env.LND_TLS_CERT = '-----BEGIN CERTIFICATE-----\nMIICertContent\n-----END CERTIFICATE-----';
      
      const config = getLndConfig();
      
      expect(config).toEqual({
        baseUrl: 'https://test-lnd:8080',
        macaroon: '01020304',
        tlsCert: '-----BEGIN CERTIFICATE-----\nMIICertContent\n-----END CERTIFICATE-----',
        network: undefined
      });
    });

    it('should include network when provided in environment variables', () => {
      // Set environment variables
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      process.env.LND_MACAROON = 'abcdef1234567890';
      process.env.LND_NETWORK = 'signet';
      
      const config = getLndConfig();
      
      expect(config).toEqual({
        baseUrl: 'https://test-lnd:8080',
        macaroon: 'abcdef1234567890',
        network: 'signet'
      });
    });

    it('should prioritize direct values over file paths', () => {
      // Set both direct values and file paths
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      process.env.LND_MACAROON = 'direct-macaroon-hex';
      process.env.LND_MACAROON_PATH = '/valid/macaroon/path';
      process.env.LND_TLS_CERT = 'direct-tls-cert-content';
      process.env.LND_TLS_CERT_PATH = '/valid/tls/path';
      process.env.LND_NETWORK = 'mainnet';
      
      const config = getLndConfig();
      
      expect(config).toEqual({
        baseUrl: 'https://test-lnd:8080',
        macaroon: 'direct-macaroon-hex',
        tlsCert: 'direct-tls-cert-content',
        network: 'mainnet'
      });
      
      // File should not be read when direct value is provided
      expect(require('fs').readFileSync).not.toHaveBeenCalled();
    });

    it('should throw error when required variables are missing', () => {
      // Missing LND_REST_API_URL
      process.env.LND_MACAROON_PATH = '/valid/macaroon/path';
      
      expect(() => getLndConfig()).toThrow('LND_REST_API_URL environment variable is required');
      
      // Missing both macaroon options
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      delete process.env.LND_MACAROON_PATH;
      delete process.env.LND_MACAROON;
      
      expect(() => getLndConfig()).toThrow('Either LND_MACAROON or LND_MACAROON_PATH environment variable is required');
    });
  });

  describe('getLndConfigWithFallback', () => {
    it('should return config from environment when available', () => {
      // Set environment variables
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      process.env.LND_MACAROON = 'direct-macaroon-hex';
      process.env.LND_NETWORK = 'signet';
      
      const config = getLndConfigWithFallback();
      
      expect(config).toEqual({
        baseUrl: 'https://test-lnd:8080',
        macaroon: 'direct-macaroon-hex',
        network: 'signet'
      });
    });

    it('should return fallback values when environment variables are missing', () => {
      // Clear environment variables
      delete process.env.LND_REST_API_URL;
      delete process.env.LND_MACAROON_PATH;
      delete process.env.LND_MACAROON;
      delete process.env.LND_NETWORK;
      
      const config = getLndConfigWithFallback();
      
      // Should match the fallback values in the implementation
      expect(config).toEqual({
        baseUrl: 'https://your-lnd-node:8080',
        macaroon: 'your-admin-macaroon-hex-here',
        network: 'mainnet'
      });
      
      // Console warning should have been called
      expect(console.warn).toHaveBeenCalled();
    });

    it('should allow overriding network parameter', () => {
      // Set environment variables with one network
      process.env.LND_REST_API_URL = 'https://test-lnd:8080';
      process.env.LND_MACAROON = 'direct-macaroon-hex';
      process.env.LND_NETWORK = 'mainnet';
      
      // Override with a different network
      const config = getLndConfigWithFallback(true, 'signet' as BitcoinNetwork);
      
      expect(config).toEqual({
        baseUrl: 'https://test-lnd:8080',
        macaroon: 'direct-macaroon-hex',
        network: 'signet'
      });
    });

    it('should use the specified network in fallback mode', () => {
      // Clear environment variables
      delete process.env.LND_REST_API_URL;
      delete process.env.LND_MACAROON_PATH;
      delete process.env.LND_MACAROON;
      delete process.env.LND_NETWORK;
      
      // Specify a network
      const config = getLndConfigWithFallback(true, 'signet' as BitcoinNetwork);
      
      expect(config).toEqual({
        baseUrl: 'https://your-lnd-node:8080',
        macaroon: 'your-admin-macaroon-hex-here',
        network: 'signet'
      });
    });
  });
}); 