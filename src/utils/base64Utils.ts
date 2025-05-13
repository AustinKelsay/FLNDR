/**
 * Utilities for working with URL-safe Base64 encoding
 * 
 * LND requires URL-safe Base64 encoding for byte fields used in URL paths.
 * This means replacing '+' with '-', '/' with '_', and keeping the trailing '=' as is.
 */

/**
 * Convert standard Base64 string to URL-safe Base64
 * @param base64 Standard Base64 string
 * @returns URL-safe Base64 string
 */
export function toUrlSafeBase64(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Convert URL-safe Base64 string to standard Base64
 * @param urlSafeBase64 URL-safe Base64 string
 * @returns Standard Base64 string
 */
export function fromUrlSafeBase64(urlSafeBase64: string): string {
  return urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
}

/**
 * Convert hex string to URL-safe Base64
 * @param hex Hexadecimal string
 * @returns URL-safe Base64 string
 */
export function hexToUrlSafeBase64(hex: string): string {
  if (!hex || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('Invalid hex string');
  }
  
  const buffer = Buffer.from(hex, 'hex');
  const base64 = buffer.toString('base64');
  return toUrlSafeBase64(base64);
}

/**
 * Convert URL-safe Base64 to hex string
 * @param urlSafeBase64 URL-safe Base64 string
 * @returns Hexadecimal string
 */
export function urlSafeBase64ToHex(urlSafeBase64: string): string {
  const base64 = fromUrlSafeBase64(urlSafeBase64);
  const buffer = Buffer.from(base64, 'base64');
  return buffer.toString('hex');
}

/**
 * Detect format (hex or base64) and convert to URL-safe Base64
 * @param input String in either hex or base64 format
 * @returns URL-safe Base64 string
 */
export function toUrlSafeBase64Format(input: string): string {
  // If it looks like hex, convert from hex to URL-safe base64
  if (/^[0-9a-fA-F]+$/.test(input)) {
    return hexToUrlSafeBase64(input);
  }
  
  // If it's already URL-safe base64, just return it
  if (!/\+|\//.test(input)) {
    return input;
  }
  
  // Otherwise assume it's standard base64 and convert
  return toUrlSafeBase64(input);
}

/**
 * Check if a string is a valid URL-safe Base64 string
 * @param str String to check
 * @returns true if the string is a valid URL-safe Base64 string
 */
export function isUrlSafeBase64(str: string): boolean {
  return /^[A-Za-z0-9\-_]+=*$/.test(str);
}

/**
 * Create an LND-compatible URL-safe base64 string for use in API calls
 * This function handles the specific requirements of LND's REST API for base64 encoding
 * 
 * @param input The input string (can be hex, standard base64, or already URL-safe base64)
 * @param urlEncode Whether to URL encode the result (for use in query parameters)
 * @returns A properly formatted URL-safe base64 string ready for LND API
 */
export function toLndUrlSafeBase64(input: string, urlEncode: boolean = false): string {
  let urlSafeBase64: string;
  
  // For standard base64 (contains + and / and possibly = padding)
  if (/^[A-Za-z0-9+/=]+$/.test(input)) {
    // Replace standard base64 chars with URL-safe versions
    urlSafeBase64 = input
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  // For URL-safe base64 already (contains - and _ and possibly = padding)
  else if (/^[A-Za-z0-9_\-=]+$/.test(input)) {
    urlSafeBase64 = input;
  }
  // For hex format
  else if (/^[A-Fa-f0-9]+$/.test(input)) {
    // Take up to 32 bytes worth of hex chars
    const hexInput = input.substring(0, 64);
    // Convert hex to binary
    const buffer = Buffer.from(hexInput, 'hex');
    // Convert binary to standard base64
    const base64 = buffer.toString('base64');
    // Convert to URL-safe base64
    urlSafeBase64 = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  // If we can't determine the format, return as-is
  else {
    urlSafeBase64 = input;
  }
  
  // URL encode if specified (needed for query parameters)
  return urlEncode ? encodeURIComponent(urlSafeBase64) : urlSafeBase64;
}

/**
 * Specifically for LND's lookup invoice by hash endpoint
 * This handles the special case for payment_hash parameter
 * 
 * @param paymentHash The payment hash in any format (hex, base64, URL-safe base64)
 * @returns URL-encoded payment hash for LND's v2/invoices/lookup endpoint
 */
export function formatLndPaymentHash(paymentHash: string): string {
  return toLndUrlSafeBase64(paymentHash, true);
}

/**
 * Convert binary data to a URL-safe base64 string for LND
 * @param buffer Binary data buffer
 * @param urlEncode Whether to URL encode the result (for use in query parameters)
 * @returns URL-safe base64 string
 */
export function bufferToLndBase64(buffer: Buffer, urlEncode: boolean = false): string {
  const base64 = buffer.toString('base64');
  const urlSafeBase64 = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return urlEncode ? encodeURIComponent(urlSafeBase64) : urlSafeBase64;
}

/**
 * Decode an LND URL-safe base64 string to binary
 * @param lndBase64 URL-safe base64 string from LND
 * @returns Buffer containing the binary data
 */
export function lndBase64ToBuffer(lndBase64: string): Buffer {
  // Convert URL-safe base64 to standard base64
  const standardBase64 = lndBase64
    .replace(/-/g, '+')
    .replace(/_/g, '/');
    
  // Add padding if necessary
  const paddedBase64 = standardBase64.padEnd(
    standardBase64.length + (4 - (standardBase64.length % 4)) % 4, 
    '='
  );
  
  // Convert to binary
  return Buffer.from(paddedBase64, 'base64');
} 