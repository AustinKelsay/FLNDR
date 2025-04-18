import { LndConnectionConfig, BitcoinNetwork } from '../types/lnd';

/**
 * Default configuration for browsers
 * This provides some sensible defaults and fallbacks for browser environments
 * where process.env is not available
 */
export interface BrowserConfigOptions {
  baseUrl?: string;
  macaroon?: string;
  tlsCert?: string;
  network?: BitcoinNetwork;
}

/**
 * Create an LndConnectionConfig suitable for browser environments
 * This function creates a config object based on provided options
 * or uses default settings where options are not provided
 * 
 * @param options Browser configuration options
 * @returns LndConnectionConfig object 
 */
export function createBrowserConfig(options: BrowserConfigOptions = {}): LndConnectionConfig {
  // Extract configuration from the provided options with fallbacks
  const baseUrl = options.baseUrl || '';
  const macaroon = options.macaroon || '';
  const tlsCert = options.tlsCert;
  const network = options.network || 'mainnet';

  // Return a properly formatted config object
  return {
    baseUrl,
    macaroon,
    tlsCert,
    network
  };
}

/**
 * This function checks if the current environment is a browser
 * @returns boolean indicating if code is running in a browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Load LND configuration from window.lndConfig if available
 * Useful for applications that want to inject configuration via the window object
 * 
 * @returns LndConnectionConfig object or null if window.lndConfig is not available
 */
export function loadLndConfigFromWindow(): LndConnectionConfig | null {
  if (isBrowser() && typeof (window as any).lndConfig !== 'undefined') {
    const windowConfig = (window as any).lndConfig;
    return {
      baseUrl: windowConfig.baseUrl || '',
      macaroon: windowConfig.macaroon || '',
      tlsCert: windowConfig.tlsCert,
      network: windowConfig.network || 'mainnet'
    };
  }
  return null;
}

/**
 * Get an LND configuration with priority:
 * 1. Provided options
 * 2. Window configuration (if available)
 * 3. Default values (empty strings for required fields)
 * 
 * @param options Browser configuration options
 * @returns LndConnectionConfig object
 */
export function getLndBrowserConfig(options: BrowserConfigOptions = {}): LndConnectionConfig {
  // First try to use provided options
  if (options.baseUrl && options.macaroon) {
    return createBrowserConfig(options);
  }
  
  // Then try window configuration
  const windowConfig = loadLndConfigFromWindow();
  if (windowConfig && windowConfig.baseUrl && windowConfig.macaroon) {
    return windowConfig;
  }
  
  // Finally fall back to provided options or empty defaults
  return createBrowserConfig(options);
} 