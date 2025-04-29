import * as FLNDR from '../index';
import { LndClient } from '../services/lndClient';
import { getLndConfig, getLndConfigWithFallback } from '../utils/config';

/**
 * This test file verifies the main exports from the FLNDR library.
 * It mainly tests if all the expected exports are available.
 */
describe('FLNDR Main Exports', () => {
  it('should export LndClient', () => {
    expect(FLNDR.LndClient).toBeDefined();
    expect(FLNDR.LndClient).toBe(LndClient);
  });

  it('should export configuration utilities', () => {
    expect(FLNDR.getLndConfig).toBeDefined();
    expect(FLNDR.getLndConfigWithFallback).toBeDefined();
    
    expect(FLNDR.getLndConfig).toBe(getLndConfig);
    expect(FLNDR.getLndConfigWithFallback).toBe(getLndConfigWithFallback);
  });

  it('should export types', () => {
    // We can check for the type definitions by verifying that the imports don't cause errors
    // The actual test is that this file compiles successfully
    expect(typeof FLNDR).toBe('object');
  });
}); 