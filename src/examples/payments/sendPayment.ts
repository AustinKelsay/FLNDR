import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to send Lightning payments
 * 
 * This example shows:
 * - How to decode a payment request
 * - How to estimate routing fees
 * - How to send a payment
 */
async function sendPaymentExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    // Example payment request (this should be replaced with a real one)
    const paymentRequest = 'lnbc1...'; // Replace with actual payment request

    // 1. First decode the payment request
    console.log('Decoding payment request...');
    const decodedRequest = await lndClient.decodePayReq(paymentRequest);
    
    console.log('\nPayment Request Details:');
    console.log('----------------------');
    console.log(`Destination: ${decodedRequest.destination}`);
    console.log(`Amount: ${decodedRequest.num_satoshis} sats`);
    console.log(`Description: ${decodedRequest.description}`);
    console.log(`Expiry: ${decodedRequest.expiry} seconds`);
    
    // Estimate the fees
    console.log('\nEstimating fees...');
    const feeEstimate = await lndClient.estimateRouteFee({
      dest: decodedRequest.destination,
      amt_sat: decodedRequest.num_satoshis
    });
    
    console.log('\nFee Estimate:');
    console.log('------------');
    console.log(`Amount to Send: ${decodedRequest.num_satoshis} sats`);
    console.log(`Routing Fee: ${Math.ceil(Number(feeEstimate.routing_fee_msat) / 1000)} sats`);
    console.log(`Time Lock Delay: ${feeEstimate.time_lock_delay} blocks`);
    
    // Calculate total cost
    const feeSats = Math.ceil(Number(feeEstimate.routing_fee_msat) / 1000);
    const totalCost = Number(decodedRequest.num_satoshis) + feeSats;
    console.log(`Total Cost: ${totalCost} sats`);
    
    // Ask for confirmation before sending payment
    console.log('\nPreparing to send payment:');
    console.log(`Total Amount: ${decodedRequest.num_satoshis} sats`);
    console.log(`Estimated Fee: ${feeSats} sats`);
    console.log(`Total Cost: ${totalCost} sats`);
    
    // 3. Send the payment
    console.log('\nSending payment...');
    try {
      const payment = await lndClient.sendPaymentV2({
        payment_request: paymentRequest,
        fee_limit_sat: (feeSats * 2).toString(), // Double the estimated fee as a buffer
        timeout_seconds: '60'
      });
      
      // Check payment status
      if (payment.status === 'SUCCEEDED') {
        console.log('\n✅ Payment successful!');
        console.log('Payment Details:');
        console.log('-----------------');
        console.log(`Amount: ${payment.value_sat} sats`);
        console.log(`Fee Paid: ${payment.fee_sat} sats`);
        console.log(`Preimage: ${payment.payment_preimage}`);
        
        // Display route information if available
        if (payment.payment_route) {
          console.log('\nRoute Information:');
          console.log('-----------------');
          console.log(`Total Hops: ${payment.payment_route.hops.length}`);
          console.log(`Total Fees: ${payment.payment_route.total_fees} sats`);
          console.log(`Total Amount: ${payment.payment_route.total_amt} sats`);
        }
      } else {
        console.log('\n❌ Payment failed!');
        console.log(`Status: ${payment.status}`);
        console.log(`Error: ${payment.payment_error}`);
        console.log(`Failure Reason: ${payment.failure_reason}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

export default sendPaymentExample; 