/**
 * Tests for browser exports
 * 
 * These tests ensure that all expected exports are available in the browser bundle
 */

// Import all browser exports
import * as browserExports from '../../browser';
import { LndClient } from '../../services/lndClient';
import { createBrowserConfig, getLndBrowserConfig } from '../../utils/browserConfig';
import { toUrlSafeBase64Format, hexToUrlSafeBase64 } from '../../utils/base64Utils';

describe('Browser exports', () => {
  it('should export LndClient', () => {
    expect(browserExports.LndClient).toBeDefined();
    expect(browserExports.LndClient).toBe(LndClient);
  });

  it('should export browser config utilities', () => {
    expect(browserExports.createBrowserConfig).toBeDefined();
    expect(browserExports.getLndBrowserConfig).toBeDefined();
    expect(browserExports.isBrowser).toBeDefined();
    expect(browserExports.loadLndConfigFromWindow).toBeDefined();
    
    expect(browserExports.createBrowserConfig).toBe(createBrowserConfig);
    expect(browserExports.getLndBrowserConfig).toBe(getLndBrowserConfig);
  });

  it('should export base64 utilities', () => {
    expect(browserExports.toUrlSafeBase64Format).toBeDefined();
    expect(browserExports.hexToUrlSafeBase64).toBeDefined();
    
    expect(browserExports.toUrlSafeBase64Format).toBe(toUrlSafeBase64Format);
    expect(browserExports.hexToUrlSafeBase64).toBe(hexToUrlSafeBase64);
  });

  it('should export version information', () => {
    expect(browserExports.version).toBeDefined();
    expect(typeof browserExports.version).toBe('string');
  });
});

/**
 * This test ensures the module can be loaded in a browser-like environment
 * and that the ES module structure is correct
 */
describe('Browser module structure', () => {
  it('should have correct ESM export structure', () => {
    // ESM exports should be directly available as named exports
    const exports = Object.keys(browserExports);
    
    expect(exports).toContain('LndClient');
    expect(exports).toContain('createBrowserConfig');
    expect(exports).toContain('getLndBrowserConfig');
    expect(exports).toContain('isBrowser');
    expect(exports).toContain('loadLndConfigFromWindow');
    expect(exports).toContain('toUrlSafeBase64Format');
    expect(exports).toContain('hexToUrlSafeBase64');
    expect(exports).toContain('version');
  });
}); 