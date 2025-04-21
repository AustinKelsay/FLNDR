/**
 * Browser-compatible exports for FLNDR
 * This file serves as the entry point for browser environments
 */

// Export the LndClient class and related interfaces
import { LndClient } from './services/lndClient';
import { 
  createBrowserConfig,
  getLndBrowserConfig,
  isBrowser,
  loadLndConfigFromWindow
} from './utils/browserConfig';

import {
  toUrlSafeBase64Format,
  hexToUrlSafeBase64
} from './utils/base64Utils';

// Export all components
export { 
  LndClient,
  createBrowserConfig,
  getLndBrowserConfig,
  isBrowser,
  loadLndConfigFromWindow,
  toUrlSafeBase64Format,
  hexToUrlSafeBase64
};

// Export all type definitions
export * from './types/lnd';
export type { LndStreamingEvents } from './services/lndClient';

/**
 * Library version
 */
export const version = '1.0.0'; // This should match your package.json version 