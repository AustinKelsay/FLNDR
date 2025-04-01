import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { BitcoinNetwork } from '../types/lnd';

// Load environment variables from .env file
dotenv.config();

/**
 * LND connection configuration loaded from environment variables
 */
export interface LndConfig {
  baseUrl: string;
  macaroon: string;
  tlsCert?: string;
  network?: BitcoinNetwork;
}

/**
 * Get LND configuration from environment variables
 * @returns LND configuration object
 */
export function getLndConfig(): LndConfig {
  // Check for required environment variables
  const baseUrl = process.env.LND_REST_API_URL;
  if (!baseUrl) {
    throw new Error('LND_REST_API_URL environment variable is required');
  }

  // Check for macaroon (either hex string or file path)
  let macaroon = process.env.LND_MACAROON;
  const macaroonPath = process.env.LND_MACAROON_PATH;

  if (!macaroon && !macaroonPath) {
    throw new Error('Either LND_MACAROON or LND_MACAROON_PATH environment variable is required');
  }

  // If macaroon path is provided but not the macaroon itself, load it from the file
  if (!macaroon && macaroonPath) {
    try {
      const macaroonFile = fs.readFileSync(macaroonPath);
      macaroon = macaroonFile.toString('hex');
    } catch (error) {
      throw new Error(`Failed to read macaroon file at ${macaroonPath}: ${error}`);
    }
  }

  // Optional TLS certificate (either content or file path)
  let tlsCert: string | undefined;
  const tlsCertContent = process.env.LND_TLS_CERT;
  const tlsCertPath = process.env.LND_TLS_CERT_PATH;

  // First check for direct TLS cert content
  if (tlsCertContent) {
    tlsCert = tlsCertContent;
  } 
  // Otherwise try to load from file path if provided
  else if (tlsCertPath) {
    try {
      tlsCert = fs.readFileSync(tlsCertPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read TLS certificate file at ${tlsCertPath}: ${error}`);
    }
  }

  // Check for network configuration
  const network = process.env.LND_NETWORK as BitcoinNetwork | undefined;

  return {
    baseUrl: baseUrl,
    macaroon: macaroon as string,
    tlsCert,
    network,
  };
}

/**
 * Get LND configuration with graceful fallback to example values
 * @param warn Whether to log a warning when using fallback values
 * @param network Optional network to connect to
 * @returns LND configuration object (either from env vars or fallback values)
 */
export function getLndConfigWithFallback(warn = true, network?: BitcoinNetwork): LndConfig {
  try {
    const config = getLndConfig();
    // If a network is specified in the function call, override the environment value
    if (network) {
      config.network = network;
    }
    return config;
  } catch (error: any) {
    if (warn) {
      console.warn(`Warning: ${error.message}`);
      console.warn('Falling back to example values. This will not connect to a real LND node.');
      console.warn('Set up the proper environment variables to connect to your LND node.');
    }

    return {
      baseUrl: 'https://your-lnd-node:8080',
      macaroon: 'your-admin-macaroon-hex-here',
      network: network || 'mainnet',
    };
  }
} 