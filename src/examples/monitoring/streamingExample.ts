import { LndClient } from '../..';
import { config } from 'dotenv';
import { Invoice, PaymentStatus, SendPaymentRequest } from '../../types/lnd';
import { getLndConfigWithFallback } from '../../utils/config';

// Load environment variables from .env file
config();

// Simple example of using LndClient to monitor invoices and payments
async function streamingExample() {
  try {
    console.log('🔍 FLNDR Streaming Example');
    console.log('==================================================');
    
    // Get configuration from environment variables with fallback
    console.log('Setting up LND client connection...');
    const lndConfig = getLndConfigWithFallback();
    
    // Initialize the unified client
    const lndClient = new LndClient(lndConfig);
    
    // Display connection info
    console.log(`Using LND node at: ${lndConfig.baseUrl}`);
    console.log('-------------------------------------------');
    
    // Set up event listeners for streaming events
    lndClient.on('open', ({ url }) => {
      console.log(`🔌 Connection opened to ${url}`);
    });
    
    lndClient.on('error', ({ url, error, message }) => {
      console.error(`❌ Error from ${url}: ${message || error.message}`);
    });
    
    lndClient.on('close', ({ url, code, reason }) => {
      console.log(`🔌 Connection closed to ${url} with code ${code} and reason: ${reason}`);
    });
    
    // Listen for invoice updates
    lndClient.on('invoice', (invoice: Invoice) => {
      console.log('📝 Invoice update received:');
      console.log(`- Hash: ${invoice.r_hash}`);
      console.log(`- Amount: ${invoice.value || 0} sats`);
      console.log(`- State: ${invoice.state}`);
      console.log(`- Memo: ${invoice.memo}`);
      console.log('-------------------');
      
      if (invoice.state === 'SETTLED') {
        console.log('💰 Invoice settled!');
      }
    });
    
    // Listen for payment updates
    lndClient.on('paymentUpdate', (payment: PaymentStatus) => {
      console.log('💸 Payment update received:');
      console.log(`- Hash: ${payment.payment_hash}`);
      console.log(`- Status: ${payment.status}`);
      console.log(`- Amount: ${payment.value_sat || 0} sats`);
      console.log(`- Fee: ${payment.fee_sat || 0} sats`);
      
      if (payment.status === 'FAILED') {
        console.log(`- Failure reason: ${payment.failure_reason}`);
        console.log('❌ Payment failed!');
      } else if (payment.status === 'SUCCEEDED') {
        console.log('✅ Payment succeeded!');
      } else if (payment.status === 'IN_FLIGHT') {
        console.log('📤 Payment in flight');
      }
      
      console.log('-------------------');
    });
    
    try {
      // Create a subscription for all invoices
      console.log('\n1️⃣ Setting up subscriptions:');
      console.log('-'.repeat(40));
      console.log('Subscribing to all invoices...');
      const invoiceSubUrl = lndClient.subscribeInvoices(true, 10, 2000); // Enable auto-reconnect, 10 retries, 2s delay
      console.log(`✅ Subscribed to all invoices`);
      
      // Create a subscription for all payments
      console.log('Subscribing to all payment updates...');
      const paymentSubUrl = lndClient.trackPaymentV2(false, true, 10, 2000); // Enable auto-reconnect
      console.log(`✅ Subscribed to all payments`);
      
      // Only try creating an invoice if we're not using fallback config
      if (lndConfig.baseUrl !== 'https://your-lnd-node:8080') {
        // Create a demo invoice to test the subscriptions
        console.log('\n2️⃣ Creating a test invoice:');
        console.log('-'.repeat(40));
        try {
          const invoice = await lndClient.addInvoice({
            memo: 'Test streaming service',
            value: '1000', // 1000 sats
            expiry: '3600', // 1 hour
          });
          
          console.log(`✅ Created invoice with payment hash: ${invoice.r_hash}`);
          console.log(`Payment request: ${invoice.payment_request}`);
          
          // Subscribe specifically to this invoice
          console.log('\n3️⃣ Setting up specific subscriptions:');
          console.log('-'.repeat(40));
          console.log('Subscribing to the specific invoice...');
          const singleInvoiceUrl = lndClient.subscribeSingleInvoice(invoice.r_hash, true); // Enable auto-reconnect
          console.log(`✅ Subscribed to single invoice`);
          
          // For demo purposes, let's track this specific payment too
          console.log('Setting up tracking for this specific payment...');
          const paymentTrackUrl = lndClient.trackPaymentByHash(invoice.r_hash, true); // Enable auto-reconnect
          console.log(`✅ Tracking payment`);
          
          // Optional: If you want to test a payment too (requires access to pay invoices)
          if (process.env.PAY_DEMO_INVOICE === 'true') {
            setTimeout(async () => {
              try {
                console.log('\n4️⃣ Testing a payment (to self):');
                console.log('-'.repeat(40));
                
                // Create a payment request
                const paymentRequest: SendPaymentRequest = {
                  payment_request: invoice.payment_request,
                };
                
                console.log('Sending payment...');
                const paymentResult = await lndClient.sendPaymentV2(paymentRequest);
                
                // Check the type of result
                if (typeof paymentResult === 'string') {
                  console.log(`✅ Payment tracking started with connection`);
                } else {
                  console.log(`✅ Payment initiated: ${paymentResult.payment_hash}`);
                }
              } catch (payError) {
                console.error('❌ Failed to send payment:', payError);
              }
            }, 2000);
          }
        } catch (invoiceError) {
          console.error('❌ Failed to create invoice:', invoiceError);
          console.log('📝 Continuing with subscriptions only (no test invoice)');
        }
      } else {
        console.log('\n⚠️ Using fallback configuration - cannot create real invoices');
        console.log('To create real invoices, set proper LND connection details in your .env file:');
        console.log('- LND_REST_API_URL=https://your-lnd-node:8080');
        console.log('- LND_MACAROON_PATH=/path/to/your/admin.macaroon');
        console.log('- or LND_MACAROON=your-hex-encoded-macaroon');
      }
      
      // Keep the process running to receive updates
      console.log('\n🔄 Waiting for updates (press Ctrl+C to exit)...');
      
      // Keep process running until Ctrl+C
      process.on('SIGINT', () => {
        console.log('\n🔌 Closing all connections...');
        lndClient.closeAllConnections();
        console.log('✅ Connections closed. Exiting.');
        process.exit(0);
      });
    } catch (subError) {
      console.error('❌ Error setting up subscriptions:', subError);
      lndClient.closeAllConnections();
    }
  } catch (initError) {
    console.error('❌ Failed to initialize streaming example:', initError);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  streamingExample().catch(error => {
    console.error('❌ Uncaught error in streaming example:', error);
    process.exit(1);
  });
}

// Export for use in other files
export default streamingExample; 