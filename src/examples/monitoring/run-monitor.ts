#!/usr/bin/env node

import { getLndConfigWithFallback } from '../../utils/config';
import mockedStreamingExample from './mockedStreamingExample';
import streamingExample from './streamingExample';

/**
 * Unified monitoring example runner
 * 
 * This module provides a convenient CLI interface to run any of the FLNDR monitoring examples.
 * It handles:
 * - Running monitoring examples (mocked, streaming, or all)
 * - Setting a time limit for how long examples run
 * - Providing a consistent interface for starting/stopping examples
 * - Cleaning up connections when done
 */

// Map of example types to their implementation functions
const EXAMPLE_MAP = {
  'mocked': mockedStreamingExample,
  'streaming': streamingExample,
};

// Type definition for example types, including aliases
type ExampleType = 'mocked' | 'streaming' | 'all';

/**
 * Run a monitoring example with automatic shutdown after specified time
 * @param exampleType The type of example to run ('mocked', 'streaming', or 'all')
 * @param timeToRun Time in seconds to run the example before shutting down (default: 30)
 */
async function runMonitoringExamples(exampleType?: ExampleType, timeToRun: number = 30): Promise<void> {
  console.log('='.repeat(50));
  console.log('FLNDR SDK Monitoring Examples');
  console.log('='.repeat(50));
  
  try {
    // Check if valid environment variables are set
    const envVars = ['LND_REST_API_URL', 'LND_MACAROON_PATH'];
    const missingVars = envVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0 && exampleType !== 'mocked') {
      console.warn('\n⚠️ Warning: Some environment variables are not set:');
      console.warn(missingVars.join(', '));
      console.warn('Examples will use fallback values for demonstration purposes.');
      console.warn('For production use, please set these variables in a .env file.\n');
    } else if (exampleType !== 'mocked') {
      console.log('✅ Environment variables successfully loaded.\n');
    }
    
    // Parse command line arguments if not provided as function parameters
    const cliExampleType = process.argv[2] || '';
    const cliTimeToRun = parseInt(process.argv[3] || '30', 10);
    
    // Use function parameters if provided, otherwise use CLI args
    const example = exampleType || cliExampleType as ExampleType || '';
    const runTime = timeToRun || cliTimeToRun || 30;
    
    // Check if we're being run as a module function or from CLI
    const isCliMode = require.main === module;
    
    // Only show available examples in CLI mode if no example specified
    if (isCliMode && !example) {
      showAvailableExamples();
      return;
    }
    
    // Helper function to run an example with timeout
    const runWithTimeout = (exampleFn: () => Promise<void> | void, time: number): Promise<void> => {
      return new Promise<void>((resolve) => {
        console.log(`\n⏱️ Will run for ${time} seconds before auto-shutting down...`);
        
        // Start the example (doesn't return a promise we can wait on)
        exampleFn();
        
        // Set a timeout to resolve after specified time
        setTimeout(() => {
          console.log(`\n⏱️ Example ran for ${time} seconds, shutting down...`);
          process.emit('SIGINT'); // Send SIGINT to trigger the example's cleanup function
          setTimeout(resolve, 1000); // Give time for cleanup
        }, time * 1000);
      });
    };
    
    // Run the specified example or all examples
    await runRequestedExamples(example, runTime, runWithTimeout);
    
  } catch (error) {
    console.error('\n❌ Error running monitoring examples:', error);
  }
}

/**
 * Run the requested example(s) based on the provided example type
 */
async function runRequestedExamples(
  example: ExampleType, 
  runTime: number,
  runWithTimeout: (exampleFn: () => Promise<void> | void, time: number) => Promise<void>
): Promise<void> {
  if (example === 'all') {
    console.log('\n🔄 Running All Monitoring Examples:');
    
    // Run each example sequentially
    console.log(`\n1️⃣ Mocked Streaming Example (${runTime} seconds):`);
    console.log('-'.repeat(40));
    await runWithTimeout(mockedStreamingExample, runTime);
    
    console.log(`\n2️⃣ Streaming Example (${runTime} seconds):`);
    console.log('-'.repeat(40));
    await runWithTimeout(streamingExample, runTime);
  } else if (example in EXAMPLE_MAP) {
    // Run a single example
    const exampleFunction = EXAMPLE_MAP[example as keyof typeof EXAMPLE_MAP];
    const exampleName = example.charAt(0).toUpperCase() + example.slice(1);
    
    console.log(`\n🔄 Running ${exampleName} Example (${runTime} seconds):`);
    console.log('-'.repeat(40));
    await runWithTimeout(exampleFunction, runTime);
  } else {
    showAvailableExamples();
  }
}

/**
 * Display the list of available monitoring examples
 */
function showAvailableExamples(): void {
  console.log('\n⚠️ Please specify which example to run:');
  console.log('Usage: npm run monitor [option] [seconds]');
  console.log('Options:');
  console.log('  mocked    - Run the mocked streaming example (no LND required)');
  console.log('  streaming - Run the streaming example (requires LND node)');
  console.log('  all       - Run all monitoring examples');
  console.log('\nExamples:');
  console.log('  npm run monitor mocked');
  console.log('  npm run monitor streaming 60  # Run for 60 seconds');
}

// Run the examples if this file is executed directly from CLI
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  runMonitoringExamples().catch(console.error);
}

export default runMonitoringExamples; 