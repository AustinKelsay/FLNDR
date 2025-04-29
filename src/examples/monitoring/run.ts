import { getLndConfigWithFallback } from '../../utils/config';
import streamingExample from './streamingExample';
import mockedStreamingExample from './mockedStreamingExample';

/**
 * Run all monitoring examples
 */
async function runMonitoringExamples() {
  console.log('='.repeat(50));
  console.log('FLNDR SDK Monitoring Examples');
  console.log('='.repeat(50));
  
  try {
    // Check if valid environment variables are set
    const envVars = ['LND_REST_API_URL', 'LND_MACAROON_PATH'];
    const missingVars = envVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('\n⚠️ Warning: Some environment variables are not set:');
      console.warn(missingVars.join(', '));
      console.warn('Examples will use fallback values for demonstration purposes.');
      console.warn('For production use, please set these variables in a .env file.\n');
    } else {
      console.log('✅ Environment variables successfully loaded.\n');
    }
    
    // Ask user which example to run
    console.log('\nAvailable monitoring examples:');
    console.log('1. Streaming Example (Real-time invoice updates)');
    console.log('2. Mocked Streaming Example (Simulated updates, no LND required)');
    console.log('3. Run all examples');
    
    const exampleToRun = process.argv[2] || '';
    
    if (exampleToRun === '1' || exampleToRun === 'streaming') {
      console.log('\n🔄 Running Streaming Example:');
      console.log('-'.repeat(40));
      await streamingExample();
    } else if (exampleToRun === '2' || exampleToRun === 'mocked') {
      console.log('\n🔄 Running Mocked Streaming Example:');
      console.log('-'.repeat(40));
      await mockedStreamingExample();
    } else if (exampleToRun === '3' || exampleToRun === 'all') {
      console.log('\n🔄 Running All Monitoring Examples:');
      
      console.log('\n1️⃣ Streaming Example:');
      console.log('-'.repeat(40));
      // Using a timeout to allow for clean shutdown between examples
      await streamingExample();
      
      console.log('\n2️⃣ Mocked Streaming Example:');
      console.log('-'.repeat(40));
      await mockedStreamingExample();
    } else {
      console.log('\n⚠️ Please specify which example to run:');
      console.log('Usage: ts-node src/examples/monitoring/run.ts [option]');
      console.log('Options:');
      console.log('  1, streaming   - Run the streaming example (requires LND node)');
      console.log('  2, mocked      - Run the mocked streaming example (no LND required)');
      console.log('  3, all         - Run all monitoring examples');
      console.log('\nExample: ts-node src/examples/monitoring/run.ts mocked');
    }
    
  } catch (error) {
    console.error('\n❌ Error running monitoring examples:', error);
  }
}

// Run the examples if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  runMonitoringExamples().catch(console.error);
}

export default runMonitoringExamples; 