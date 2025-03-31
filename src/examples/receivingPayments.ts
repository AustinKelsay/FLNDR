import { LndClient } from '../services/lndClient';

// Example of using the LndClient for channel balance and receiving payments
async function main() {
  // Create a new LndClient instance with your LND REST connection details
  const lndClient = new LndClient({
    baseUrl: 'https://your-lnd-node:8080',
    macaroon: 'your-admin-macaroon-hex-here', // hex encoded macaroon
  });

  try {
    // Get channel balance
    console.log('Getting channel balance...');
    const balance = await lndClient.channelBalance();
    console.log('Channel balance:', balance);
    console.log(`Local balance: ${balance.local_balance.sat} sats`);
    console.log(`Remote balance: ${balance.remote_balance.sat} sats`);
    
    // Create a new invoice
    console.log('\nCreating a new invoice...');
    const invoiceRequest = {
      memo: 'Test invoice from FLNDR',
      value: '10000', // 10,000 satoshis = 0.0001 BTC
      expiry: '3600', // 1 hour
    };
    
    const invoice = await lndClient.addInvoice(invoiceRequest);
    console.log('Invoice created:');
    console.log(`Payment request: ${invoice.payment_request}`);
    console.log(`Payment hash: ${invoice.r_hash}`);
    
    // Lookup the invoice
    console.log('\nLooking up the invoice...');
    const invoiceDetails = await lndClient.lookupInvoiceV2(invoice.r_hash);
    console.log('Invoice details:', invoiceDetails);
    
    // List payments
    console.log('\nListing recent payments...');
    const payments = await lndClient.listPayments({
      max_payments: 5,
      include_incomplete: true
    });
    
    console.log(`Found ${payments.payments.length} payments:`);
    payments.payments.forEach((payment, i) => {
      console.log(`Payment ${i + 1}:`);
      console.log(`- Hash: ${payment.payment_hash}`);
      console.log(`- Amount: ${payment.value_sat} sats`);
      console.log(`- Status: ${payment.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main().catch(console.error); 