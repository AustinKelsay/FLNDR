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
import addInvoiceExample from './receiving/addInvoice';
import lookupInvoiceExample from './receiving/lookupInvoice';
import listInvoicesExample from './receiving/listInvoices';
import listPaymentsExample from './payments/listPayments';

/**
 * Run all examples in sequence
 */
async function runExamples() {
  console.log('='.repeat(5));
  console.log('FLNDR SDK Examples');
  console.log('='.repeat(5));
  
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
    console.log('-'.repeat(5));
    await getInfoExample();
    
    console.log('\n-'.repeat(5));
    await channelBalanceExample();
    
    // Receiving examples
    console.log('\n\n2️⃣ Running Receiving Examples:');
    console.log('-'.repeat(5));
    await addInvoiceExample();
    
    console.log('\n-'.repeat(5));
    await lookupInvoiceExample();
    
    console.log('\n-'.repeat(5));
    await listInvoicesExample();
    
    // Payment examples
    console.log('\n\n3️⃣ Running Payment Examples:');
    console.log('-'.repeat(5));
    await listPaymentsExample();
    
    console.log('\n='.repeat(5));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(5));
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