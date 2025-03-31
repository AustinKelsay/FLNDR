import { LndClient } from '../../services/lndClient';

/**
 * Example demonstrating how to list payments
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to list payments with different filtering and pagination options
 * - How to work with the payment list
 */
async function listPaymentsExample() {
  // Create a new LndClient instance with your LND REST connection details
  const lndClient = new LndClient({
    baseUrl: 'https://your-lnd-node:8080',
    macaroon: 'your-admin-macaroon-hex-here', // hex encoded macaroon
  });

  try {
    // Example 1: Basic payment listing
    console.log('1. Basic Payment Listing:');
    console.log('----------------------');
    const basicPayments = await lndClient.listPayments({
      max_payments: 5 // Limit to the 5 most recent payments
    });
    
    console.log(`Found ${basicPayments.payments.length} payments`);
    console.log(`Total payments in history: ${basicPayments.total_num_payments}`);
    
    if (basicPayments.payments.length > 0) {
      console.log('\nRecent Payments:');
      basicPayments.payments.forEach((payment, i) => {
        console.log(`\nPayment ${i + 1}:`);
        console.log(`Hash: ${payment.payment_hash}`);
        console.log(`Amount: ${payment.value_sat} sats`);
        console.log(`Status: ${payment.status}`);
        console.log(`Date: ${new Date(Number(payment.creation_date) * 1000).toLocaleString()}`);
      });
    }
    
    // Example 2: List failed payments
    console.log('\n\n2. List Failed Payments:');
    console.log('----------------------');
    
    // First, get all payments
    const allPayments = await lndClient.listPayments({
      max_payments: 50,
      include_incomplete: true
    });
    
    // Filter for failed payments
    const failedPayments = allPayments.payments.filter(p => 
      p.status === 'FAILED' || p.failure_reason !== 'FAILURE_REASON_NONE');
    
    console.log(`Found ${failedPayments.length} failed payments`);
    
    if (failedPayments.length > 0) {
      console.log('\nFailed Payments:');
      failedPayments.forEach((payment, i) => {
        console.log(`\nFailed Payment ${i + 1}:`);
        console.log(`Hash: ${payment.payment_hash}`);
        console.log(`Amount: ${payment.value_sat} sats`);
        console.log(`Failure Reason: ${payment.failure_reason}`);
        console.log(`Date: ${new Date(Number(payment.creation_date) * 1000).toLocaleString()}`);
      });
    }
    
    // Example 3: Pagination example
    console.log('\n\n3. Paginated Payment Listing:');
    console.log('---------------------------');
    
    // Get first page of results
    const page1 = await lndClient.listPayments({
      max_payments: 3
    });
    
    console.log('Page 1 Results:');
    page1.payments.forEach((payment, i) => {
      console.log(`Payment ${i + 1}: ${payment.payment_hash} (${payment.value_sat} sats)`);
    });
    
    // If there are more results, get the next page
    if (page1.payments.length === 3) {
      const page2 = await lndClient.listPayments({
        max_payments: 3,
        index_offset: page1.last_index_offset
      });
      
      console.log('\nPage 2 Results:');
      page2.payments.forEach((payment, i) => {
        console.log(`Payment ${i + 1}: ${payment.payment_hash} (${payment.value_sat} sats)`);
      });
    }
    
    // Example 4: Date range filtering
    console.log('\n\n4. Date-Filtered Payment Listing:');
    console.log('-------------------------------');
    
    // Get payments from the last 7 days
    const oneWeekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    
    const recentPayments = await lndClient.listPayments({
      creation_date_start: oneWeekAgo.toString(),
      max_payments: 10
    });
    
    console.log(`Found ${recentPayments.payments.length} payments in the last 7 days`);
    
    if (recentPayments.payments.length > 0) {
      console.log('\nRecent Payments:');
      recentPayments.payments.forEach((payment, i) => {
        console.log(`Payment ${i + 1}: ${payment.payment_hash} - ${new Date(Number(payment.creation_date) * 1000).toLocaleDateString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error listing payments:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  listPaymentsExample().catch(console.error);
}

export default listPaymentsExample; 