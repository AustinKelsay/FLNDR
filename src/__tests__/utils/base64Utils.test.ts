import {
  toUrlSafeBase64,
  fromUrlSafeBase64,
  hexToUrlSafeBase64,
  urlSafeBase64ToHex,
  toUrlSafeBase64Format,
  isUrlSafeBase64
} from '../../utils/base64Utils';

describe('Base64 Utils', () => {
  describe('toUrlSafeBase64', () => {
    it('should convert standard base64 to URL-safe base64', () => {
      expect(toUrlSafeBase64('a+b/c=')).toBe('a-b_c=');
      expect(toUrlSafeBase64('AB+/CD==')).toBe('AB-_CD==');
    });

    it('should leave URL-safe base64 unchanged', () => {
      expect(toUrlSafeBase64('a-b_c=')).toBe('a-b_c=');
    });
  });

  describe('fromUrlSafeBase64', () => {
    it('should convert URL-safe base64 to standard base64', () => {
      expect(fromUrlSafeBase64('a-b_c=')).toBe('a+b/c=');
      expect(fromUrlSafeBase64('AB-_CD==')).toBe('AB+/CD==');
    });

    it('should leave standard base64 unchanged', () => {
      expect(fromUrlSafeBase64('a+b/c=')).toBe('a+b/c=');
    });
  });

  describe('hexToUrlSafeBase64', () => {
    it('should convert hex to URL-safe base64', () => {
      // The hex string "48656c6c6f" is "Hello" in ASCII
      // Base64 encoding of "Hello" is "SGVsbG8="
      expect(hexToUrlSafeBase64('48656c6c6f')).toBe('SGVsbG8=');
    });

    it('should handle empty input', () => {
      expect(() => hexToUrlSafeBase64('')).toThrow('Invalid hex string');
    });

    it('should throw error for invalid hex', () => {
      expect(() => hexToUrlSafeBase64('not-hex')).toThrow('Invalid hex string');
    });
  });

  describe('urlSafeBase64ToHex', () => {
    it('should convert URL-safe base64 to hex', () => {
      // The URL-safe base64 "SGVsbG8=" is "Hello" in ASCII
      // Hex encoding of "Hello" is "48656c6c6f"
      expect(urlSafeBase64ToHex('SGVsbG8=')).toBe('48656c6c6f');
    });

    it('should handle URL-safe characters', () => {
      // The URL-safe base64 "a-b_c=" would be "a+b/c=" in standard base64
      const result = urlSafeBase64ToHex('a-b_c=');
      // This is the actual hex output for the given input
      expect(result).toBe('6be6ff');
    });
  });

  describe('toUrlSafeBase64Format', () => {
    it('should convert hex to URL-safe base64', () => {
      expect(toUrlSafeBase64Format('48656c6c6f')).toBe('SGVsbG8=');
    });

    it('should convert standard base64 to URL-safe base64', () => {
      expect(toUrlSafeBase64Format('a+b/c=')).toBe('a-b_c=');
    });

    it('should leave URL-safe base64 unchanged', () => {
      expect(toUrlSafeBase64Format('a-b_c=')).toBe('a-b_c=');
    });
  });

  describe('isUrlSafeBase64', () => {
    it('should return true for valid URL-safe base64', () => {
      expect(isUrlSafeBase64('SGVsbG8=')).toBe(true);
      expect(isUrlSafeBase64('a-b_c=')).toBe(true);
    });

    it('should return false for standard base64', () => {
      expect(isUrlSafeBase64('a+b/c=')).toBe(false);
    });

    it('should return false for non-base64 strings', () => {
      expect(isUrlSafeBase64('not-base64!')).toBe(false);
    });
  });
}); 