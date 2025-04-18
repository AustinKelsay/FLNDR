/**
 * Browser-compatible exports for FLNDR
 * This file serves as the entry point for browser environments
 */

// Export the LndClient class and related interfaces
export { LndClient } from './services/lndClient';
export type { LndStreamingEvents } from './services/lndClient';

// Export all type definitions
export * from './types/lnd';

// Export browser-specific utilities
export {
  createBrowserConfig,
  getLndBrowserConfig,
  isBrowser,
  loadLndConfigFromWindow
} from './utils/browserConfig';

// Export base64 utilities that are used in both environments
export {
  toUrlSafeBase64Format,
  hexToUrlSafeBase64
} from './utils/base64Utils';

/**
 * Library version
 */
export const version = '1.0.0'; // This should match your package.json version 