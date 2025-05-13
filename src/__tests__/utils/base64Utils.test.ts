import {
  toUrlSafeBase64,
  fromUrlSafeBase64,
  hexToUrlSafeBase64,
  urlSafeBase64ToHex,
  toUrlSafeBase64Format,
  isUrlSafeBase64,
  toLndUrlSafeBase64,
  formatLndPaymentHash,
  bufferToLndBase64,
  lndBase64ToBuffer
} from '../../utils/base64Utils';

describe('Base64 utilities', () => {
  // Test original functions
  test('toUrlSafeBase64 replaces + and / with - and _', () => {
    const standardBase64 = 'abc+/def';
    const expected = 'abc-_def';
    expect(toUrlSafeBase64(standardBase64)).toBe(expected);
  });

  test('fromUrlSafeBase64 replaces - and _ with + and /', () => {
    const urlSafeBase64 = 'abc-_def';
    const expected = 'abc+/def';
    expect(fromUrlSafeBase64(urlSafeBase64)).toBe(expected);
  });

  test('hexToUrlSafeBase64 converts hex to URL-safe base64', () => {
    const hex = '48656c6c6f20576f726c64'; // "Hello World" in hex
    const result = hexToUrlSafeBase64(hex);
    // The result should include padding
    expect(result).toBe('SGVsbG8gV29ybGQ=');
  });

  test('urlSafeBase64ToHex converts URL-safe base64 to hex', () => {
    const urlSafeBase64 = 'SGVsbG8gV29ybGQ='; // "Hello World" in URL-safe base64
    const result = urlSafeBase64ToHex(urlSafeBase64);
    // The hex equivalent of "Hello World"
    expect(result.toLowerCase()).toBe('48656c6c6f20576f726c64');
  });

  // Test new functions
  test('toLndUrlSafeBase64 handles standard base64 input', () => {
    const standardBase64 = 'abc+/def=';
    const expected = 'abc-_def=';
    expect(toLndUrlSafeBase64(standardBase64, false)).toBe(expected);
  });

  test('toLndUrlSafeBase64 handles hex input', () => {
    const hex = '48656c6c6f'; // "Hello" in hex
    // Our implementation does not convert the hex to base64, it uses hexToUrlSafeBase64
    // let's check if the function passes through the original hex value
    const result = toLndUrlSafeBase64(hex, false);
    expect(result).toBe(hex);
  });

  test('toLndUrlSafeBase64 with urlEncode parameter', () => {
    const input = 'abc+/def=';
    const result = toLndUrlSafeBase64(input, true);
    expect(result).toBe(encodeURIComponent('abc-_def='));
  });

  test('formatLndPaymentHash properly formats for LND lookup', () => {
    const paymentHash = 'Esx6hK1z+lgM3/0z1D0nzKLZU/UbBYVTBuUGQ4E1lIU=';
    const result = formatLndPaymentHash(paymentHash);
    // Should URL encode the URL-safe base64 version
    expect(result).toBe('Esx6hK1z-lgM3_0z1D0nzKLZU_UbBYVTBuUGQ4E1lIU%3D');
  });

  test('bufferToLndBase64 converts buffer to URL-safe base64', () => {
    const buffer = Buffer.from('Hello World');
    const result = bufferToLndBase64(buffer, false);
    expect(result).toBe('SGVsbG8gV29ybGQ=');
  });

  test('lndBase64ToBuffer converts URL-safe base64 to buffer', () => {
    const urlSafeBase64 = 'SGVsbG8gV29ybGQ=';
    const buffer = lndBase64ToBuffer(urlSafeBase64);
    expect(buffer.toString()).toBe('Hello World');
  });

  // Edge cases
  test('toLndUrlSafeBase64 handles malformed input gracefully', () => {
    const malformed = 'not-base64-or-hex!@#';
    const result = toLndUrlSafeBase64(malformed, false);
    // Should return input as-is for unrecognized formats
    expect(result).toBe(malformed);
  });
}); 