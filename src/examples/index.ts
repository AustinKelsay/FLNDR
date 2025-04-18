/**
 * FLNDR Examples
 * 
 * This file runs all the examples for the FLNDR SDK.
 * It demonstrates how to use the SDK to interact with an LND node's REST API.
 */

// Import dotenv to load environment variables
import 'dotenv/config';

// Import example functions
import getInfoExample from './info/getInfo';
import channelBalanceExample from './info/channelBalance';
import networkDetectionExample from './info/networkDetectionExample';
import addInvoiceExample from './receiving/addInvoice';
import lookupInvoiceExample from './receiving/lookupInvoice';
import listInvoicesExample from './receiving/listInvoices';
import listPaymentsExample from './payments/listPayments';
import sendPaymentExample from './payments/sendPayment';
import decodePayReqExample from './payments/decodePayReq';
import estimateRouteFeeExample from './payments/estimateRouteFee';
// We import but don't automatically run the streaming example
// since it creates long-running connections
import { streamingExample } from './monitoring';
// Import the mocked streaming example
import mockedStreamingExample from './monitoring/mockedStreamingExample';

/**
 * Run all examples in sequence
 */
async function runExamples() {
  console.log('='.repeat(10));
  console.log('FLNDR SDK Examples');
  console.log('='.repeat(10));
  
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
    
    // Info examples
    console.log('\n1️⃣ Running Info Examples:');
    console.log('-'.repeat(10));
    await getInfoExample();
    
    console.log('\n-'.repeat(10));
    await channelBalanceExample();
    
    console.log('\n-'.repeat(10));
    await networkDetectionExample();
    
    // Receiving examples
    console.log('\n\n2️⃣ Running Receiving Examples:');
    console.log('-'.repeat(10));
    await addInvoiceExample();
    
    console.log('\n-'.repeat(10));
    await lookupInvoiceExample();
    
    console.log('\n-'.repeat(10));
    await listInvoicesExample();
    
    // Payment examples
    console.log('\n\n3️⃣ Running Payment Examples:');
    console.log('-'.repeat(10));
    await listPaymentsExample();
    
    console.log('\n-'.repeat(10));
    await decodePayReqExample();
    
    console.log('\n-'.repeat(10));
    await estimateRouteFeeExample();
    
    console.log('\n-'.repeat(10));
    await sendPaymentExample();
    
    // Monitoring examples
    console.log('\n\n4️⃣ About Monitoring Examples:');
    console.log('-'.repeat(10));
    console.log('The streaming examples create long-running WebSocket connections');
    console.log('and are designed to be run separately. To run them, use:');
    console.log('npx ts-node src/examples/monitoring/streamingExample.ts');
    console.log('\nThese examples demonstrate:');
    console.log('- Subscribing to all invoices (subscribeInvoices)');
    console.log('- Tracking a specific invoice (subscribeSingleInvoice)');
    console.log('- Tracking a specific payment (trackPayment)');
    console.log('- Tracking all payments (trackPaymentV2)');
    
    // Ask if the user wants to run the mocked streaming example
    console.log('\nWould you like to run the mocked streaming example?');
    console.log('It simulates WebSocket events without requiring an active LND node.');
    console.log('Enter "y" and press Enter to run it, or press Enter to skip.');
    
    // For simplicity, we'll just run it directly in this example
    const runMockedExample = process.env.RUN_MOCKED_STREAMING === 'true';
    
    if (runMockedExample) {
      console.log('\nRunning mocked streaming example...\n');
      await mockedStreamingExample();
    } else {
      console.log('\nSkipping mocked streaming example.');
      console.log('You can run it separately with:');
      console.log('npx ts-node src/examples/monitoring/mockedStreamingExample.ts');
    }
    
    console.log('\n='.repeat(10));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(10));
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run the examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export default runExamples; 