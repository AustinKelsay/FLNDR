import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to create Lightning invoices
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to create Lightning invoices with different options
 * - How to work with the invoice responses
 */
async function addInvoiceExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    console.log('Creating invoices with different configurations...');
    
    // Example 1: Basic invoice with just an amount
    console.log('\n1. Basic Invoice:');
    console.log('---------------');
    const basicInvoice = await lndClient.addInvoice({
      value: '10000', // 10,000 satoshis (0.0001 BTC)
    });
    console.log(`Payment Request: ${basicInvoice.payment_request}`);
    console.log(`Payment Hash: ${basicInvoice.r_hash}`);
    console.log(`Add Index: ${basicInvoice.add_index}`);

    // Example 2: Invoice with memo and custom expiry
    console.log('\n2. Invoice with Memo and Custom Expiry:');
    console.log('-------------------------------------');
    const customInvoice = await lndClient.addInvoice({
      memo: 'Payment for services rendered',
      value: '50000', // 50,000 satoshis (0.0005 BTC)
      expiry: '86400', // 24 hours instead of the default
    });
    console.log(`Payment Request: ${customInvoice.payment_request}`);
    console.log(`Payment Hash: ${customInvoice.r_hash}`);
    
    // Example 3: Private invoice (not announced to the network)
    console.log('\n3. Private Invoice:');
    console.log('-----------------');
    const privateInvoice = await lndClient.addInvoice({
      memo: 'Confidential transaction',
      value: '100000', // 100,000 satoshis (0.001 BTC)
      private: true, // This makes the invoice private
    });
    console.log(`Payment Request: ${privateInvoice.payment_request}`);
    console.log(`Payment Hash: ${privateInvoice.r_hash}`);
    
    // Example 4: Specify millisatoshi amount for precise payments
    console.log('\n4. Millisatoshi Invoice:');
    console.log('---------------------');
    const msatInvoice = await lndClient.addInvoice({
      memo: 'Precise payment',
      value_msat: '123456789', // More precise than satoshis
    });
    console.log(`Payment Request: ${msatInvoice.payment_request}`);
    console.log(`Payment Hash: ${msatInvoice.r_hash}`);
    
    console.log('\nAll invoices created successfully!');
    
  } catch (error) {
    console.error('Error creating invoices:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  addInvoiceExample().catch(console.error);
}

export default addInvoiceExample; 