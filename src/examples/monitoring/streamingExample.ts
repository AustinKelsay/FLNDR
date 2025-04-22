import { LndClient } from '../..';
import { config } from 'dotenv';
import { Invoice, PaymentStatus, SendPaymentRequest } from '../../types/lnd';

// Load environment variables from .env file
config();

// Simple example of using LndClient to monitor invoices and payments
async function streamingExample() {
  // Connection details should be in .env
  const baseUrl = process.env.LND_REST_URL || 'https://localhost:8080';
  const macaroon = process.env.LND_MACAROON || '';
  
  if (!macaroon) {
    console.error('LND_MACAROON environment variable is required');
    process.exit(1);
  }
  
  // Initialize the unified client
  const lndClient = new LndClient({
    baseUrl,
    macaroon
  });
  
  // Set up event listeners for streaming events
  lndClient.on('open', ({ url }) => {
    console.log(`Connection opened to ${url}`);
  });
  
  lndClient.on('error', ({ url, error, message }) => {
    console.error(`Error from ${url}: ${message || error.message}`);
  });
  
  lndClient.on('close', ({ url, code, reason }) => {
    console.log(`Connection closed to ${url} with code ${code} and reason: ${reason}`);
  });
  
  // Listen for invoice updates
  lndClient.on('invoice', (invoice: Invoice) => {
    console.log('Invoice update received:');
    console.log(`- Hash: ${invoice.r_hash}`);
    console.log(`- Amount: ${invoice.value || 0} sats`);
    console.log(`- State: ${invoice.state}`);
    console.log(`- Memo: ${invoice.memo}`);
    console.log('-------------------');
  });
  
  // Listen for payment updates
  lndClient.on('paymentUpdate', (payment: PaymentStatus) => {
    console.log('Payment update received:');
    console.log(`- Hash: ${payment.payment_hash}`);
    console.log(`- Status: ${payment.status}`);
    console.log(`- Amount: ${payment.value_sat || 0} sats`);
    console.log(`- Fee: ${payment.fee_sat || 0} sats`);
    
    if (payment.status === 'FAILED') {
      console.log(`- Failure reason: ${payment.failure_reason}`);
    }
    
    console.log('-------------------');
  });
  
  try {
    // Create a subscription for all invoices
    console.log('Subscribing to all invoices...');
    const invoiceSubUrl = lndClient.subscribeInvoices(true); // Enable auto-reconnect
    console.log(`Subscribed to all invoices at ${invoiceSubUrl}`);
    
    // Create a subscription for all payments
    console.log('Subscribing to all payment updates...');
    const paymentSubUrl = lndClient.trackPaymentV2(false, true); // Enable auto-reconnect
    console.log(`Subscribed to all payments at ${paymentSubUrl}`);
    
    // Create a demo invoice to test the subscriptions
    console.log('Creating a test invoice...');
    const invoice = await lndClient.addInvoice({
      memo: 'Test streaming service',
      value: '1000', // 1000 sats
      expiry: '3600', // 1 hour
    });
    
    console.log(`Created invoice with payment hash: ${invoice.r_hash}`);
    console.log(`Payment request: ${invoice.payment_request}`);
    
    // Subscribe specifically to this invoice
    console.log('Subscribing to the specific invoice...');
    const singleInvoiceUrl = lndClient.subscribeSingleInvoice(invoice.r_hash, true); // Enable auto-reconnect
    console.log(`Subscribed to single invoice at ${singleInvoiceUrl}`);
    
    // For demo purposes, let's track this specific payment too
    console.log('Setting up tracking for this specific payment...');
    const paymentTrackUrl = lndClient.trackPaymentByHash(invoice.r_hash, true); // Enable auto-reconnect
    console.log(`Tracking payment at ${paymentTrackUrl}`);
    
    // Keep the process running to receive updates
    console.log('\nWaiting for updates (Ctrl+C to exit)...');
    console.log('You can pay the invoice from another LND node to see payment updates.');
    
    // Optional: If you want to test a payment too (requires access to pay invoices)
    if (process.env.PAY_DEMO_INVOICE === 'true') {
      // This is just for testing - in real world you'd use a different node
      console.log('\n⚠️ Making a payment to self (for testing only)');
      
      // Create a payment request
      const paymentRequest: SendPaymentRequest = {
        payment_request: invoice.payment_request,
        // timeout_seconds is optional - defaults to 60 seconds if not specified
      };
      
      // Wait a bit to make sure all subscriptions are set up
      setTimeout(async () => {
        try {
          console.log('Sending payment...');
          const paymentResult = await lndClient.sendPaymentV2(paymentRequest);
          console.log(`Payment initiated: ${paymentResult.payment_hash}`);
        } catch (error) {
          console.error('Failed to send payment:', error);
        }
      }, 2000);
    }
    
    // Keep process running until Ctrl+C
    process.on('SIGINT', () => {
      console.log('\nClosing all connections...');
      lndClient.closeAllConnections();
      console.log('Connections closed. Exiting.');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error in streaming example:', error);
    lndClient.closeAllConnections();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  streamingExample().catch(console.error);
}

// Export for use in other files
export default streamingExample; 