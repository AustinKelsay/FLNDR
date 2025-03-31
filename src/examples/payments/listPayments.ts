import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to list Lightning payments
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to list payments with various filtering options
 * - How to analyze payment data
 */
async function listPaymentsExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    // Get all payments
    console.log('Fetching all payments...');
    const allPayments = await lndClient.listPayments();
    
    console.log(`\nFound ${allPayments.payments.length} payments in total`);
    
    // Calculate total amount sent in payments
    const totalSent = allPayments.payments
      .reduce((sum, payment) => sum + Number(payment.value_sat), 0);
      
    console.log(`Total amount sent: ${totalSent} sats`);
    
    // Display the most recent 3 payments
    console.log('\nMost recent payments:');
    console.log('-------------------');
    
    const recentPayments = [...allPayments.payments]
      .sort((a, b) => Number(b.creation_date) - Number(a.creation_date))
      .slice(0, 3);
      
    recentPayments.forEach((payment, i) => {
      const date = new Date(Number(payment.creation_date) * 1000).toLocaleString();
      console.log(`\nPayment #${i + 1}:`);
      console.log(`  Date: ${date}`);
      console.log(`  Amount: ${payment.value_sat} sats (${payment.value_msat} msats)`);
      console.log(`  Fee: ${payment.fee_sat} sats (${payment.fee_msat} msats)`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Payment Hash: ${payment.payment_hash}`);
      
      // Display payment description if available
      if (payment.payment_request) {
        console.log(`  Payment Request: ${payment.payment_request.substring(0, 30)}...`);
      }
      
      // Display destination if available
      if (payment.path && payment.path.length > 0) {
        console.log(`  Destination: ${payment.path[payment.path.length - 1]}`);
      }
    });
    
    // Analyze payment success rate
    console.log('\nPayment Success Rate Analysis:');
    console.log('----------------------------');
    
    const paymentsByStatus = new Map();
    
    allPayments.payments.forEach(payment => {
      const status = payment.status;
      paymentsByStatus.set(status, (paymentsByStatus.get(status) || 0) + 1);
    });
    
    // Display statistics by status
    for (const [status, count] of paymentsByStatus.entries()) {
      const percentage = (count / allPayments.payments.length * 100).toFixed(1);
      console.log(`${status}: ${count} payments (${percentage}%)`);
    }
    
    // Calculate average fee rate
    const successfulPayments = allPayments.payments.filter(p => p.status === 'SUCCEEDED');
    
    if (successfulPayments.length > 0) {
      const totalFees = successfulPayments.reduce((sum, p) => sum + Number(p.fee_sat), 0);
      const totalAmount = successfulPayments.reduce((sum, p) => sum + Number(p.value_sat), 0);
      
      const avgFeeRate = (totalFees / totalAmount * 100).toFixed(3);
      const avgFee = (totalFees / successfulPayments.length).toFixed(1);
      
      console.log(`\nAverage fee per payment: ${avgFee} sats`);
      console.log(`Average fee rate: ${avgFeeRate}%`);
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