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