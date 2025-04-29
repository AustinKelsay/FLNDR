import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to lookup Lightning invoices
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to create an invoice and then look it up
 * - How to parse the detailed invoice information
 */
async function lookupInvoiceExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    // First, create an invoice so we have something to look up
    console.log('Creating an example invoice...');
    const newInvoice = await lndClient.addInvoice({
      memo: 'Invoice for testing lookup',
      value: '15000', // 15,000 satoshis
      expiry: '3600', // 1 hour
    });
    
    console.log(`Created invoice with payment hash: ${newInvoice.r_hash}`);
    
    // Now lookup the invoice we just created
    console.log('\nLooking up the invoice...');
    const invoice = await lndClient.lookupInvoiceV2(newInvoice.r_hash);
    
    // Display basic invoice details
    console.log('\nInvoice Details:');
    console.log('---------------');
    console.log(`Memo: ${invoice.memo}`);
    console.log(`Amount: ${invoice.value} sats (${invoice.value_msat} msats)`);
    console.log(`Payment Hash: ${invoice.r_hash}`);
    console.log(`Payment Request: ${invoice.payment_request}`);
    
    // Display invoice state and timestamps
    console.log('\nInvoice State:');
    console.log('-------------');
    console.log(`State: ${invoice.state}`);
    console.log(`Settled: ${invoice.settled ? 'Yes' : 'No'}`);
    
    // Convert timestamps to readable dates
    const creationDate = new Date(Number(invoice.creation_date) * 1000).toLocaleString();
    console.log(`Creation Date: ${creationDate}`);
    
    if (invoice.settle_date && Number(invoice.settle_date) > 0) {
      const settleDate = new Date(Number(invoice.settle_date) * 1000).toLocaleString();
      console.log(`Settlement Date: ${settleDate}`);
    }
    
    // Calculate expiry
    const expiryDate = new Date((Number(invoice.creation_date) + Number(invoice.expiry)) * 1000).toLocaleString();
    console.log(`Expires: ${expiryDate}`);
    
    // Display payment information if settled
    if (invoice.settled) {
      console.log('\nPayment Information:');
      console.log('-------------------');
      console.log(`Amount Paid: ${invoice.amt_paid_sat} sats (${invoice.amt_paid_msat} msats)`);
      
      // Display HTLC information if available
      if (invoice.htlcs && invoice.htlcs.length > 0) {
        console.log('\nHTLC Information:');
        console.log('-----------------');
        invoice.htlcs.forEach((htlc, i) => {
          console.log(`HTLC #${i + 1}:`);
          console.log(`  Channel ID: ${htlc.chan_id}`);
          console.log(`  Amount: ${htlc.amt_msat} msats`);
          console.log(`  State: ${htlc.state}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error looking up invoice:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  lookupInvoiceExample().catch(console.error);
}

export default lookupInvoiceExample; 