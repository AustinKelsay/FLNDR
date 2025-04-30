/**
 * FLNDR Monitoring Examples
 * 
 * This module provides examples demonstrating real-time WebSocket streaming 
 * capabilities of the FLNDR SDK. Each example showcases different aspects of
 * the real-time monitoring functionality.
 * 
 * Available examples:
 * 
 * - mockedStreamingExample: Simulated streaming for development/testing
 *   Doesn't require an actual LND node connection, useful for testing UI/UX.
 * 
 * - streamingExample: Advanced example with robust error handling
 *   Includes comprehensive error handling, reconnection logic, and detailed event logging.
 * 
 * Usage with autorun:
 *   import { run } from 'flndr/examples/monitoring';
 *   run('streaming', 30); // Run the streaming example for 30 seconds
 * 
 * Manual usage:
 *   import { mockedStreamingExample } from 'flndr/examples/monitoring';
 *   mockedStreamingExample();
 */

import mockedStreamingExample from './mockedStreamingExample';
import streamingExample from './streamingExample';
import runMonitoringExamples from './run-monitor';

// Export all monitoring examples
export {
  mockedStreamingExample,
  streamingExample,
  runMonitoringExamples as run
};

// Type definition for example types
export type ExampleType = 'mocked' | 'streaming' | 'all';

/**
 * Monitoring examples object with convenience methods and aliases
 */
const monitoring = {
  // Original example functions
  mockedStreamingExample, 
  streamingExample,
  
  // Type aliases
  mocked: mockedStreamingExample,
  streaming: streamingExample,
  
  // Run helper to auto-shutdown examples after specified duration
  run: async (type: ExampleType, duration?: number) => {
    return runMonitoringExamples(type, duration);
  },
  
  // Run all examples sequentially
  runAll: async (duration: number = 30) => {
    return runMonitoringExamples('all', duration);
  }
};

// Default export the consolidated monitoring object
export default monitoring; 