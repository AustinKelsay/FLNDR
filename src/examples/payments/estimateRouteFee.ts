import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to estimate Lightning routing fees
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to estimate fees for different payment scenarios
 * - How to analyze the fee estimates and success probability
 */
async function estimateRouteFeeExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    // Example payment scenarios
    const scenarios = [
      {
        amount: 5000,
        description: 'Small Payment (5000 sats)',
        // ACINQ's node on signet
        destinationPubkey: '0369bbfcb51806cab960301489c37e98e74a38f83a874d0ce0e57f5d8cc9052394'
      },
      {
        amount: 100_000,
        description: 'Medium Payment (100,000 sats)',
        // River's node on signet
        destinationPubkey: '03c2abfa93eacec04721c019644584424aab2ba4dff3ac9bdab4e9c97007491dda'
      },
      {
        amount: 1_000_000,
        description: 'Large Payment (1,000,000 sats)',
        // Bitfinex's node on signet
        destinationPubkey: '02d96eadea3d780104449aca7a6a6bf37f6174b84218c2141d082f2d3bba024d4f'
      }
    ];
    
    for (const [index, scenario] of scenarios.entries()) {
      console.log(`\nScenario #${index + 1}: ${scenario.description}`);
      console.log('-'.repeat(40));
      
      try {
        const estimate = await lndClient.estimateRouteFee({
          dest: scenario.destinationPubkey,
          amt_sat: scenario.amount.toString()
        });
        
        // Display fee information
        console.log('Fee Estimate:');
        console.log('------------');
        console.log(`Amount to Send: ${scenario.amount} sats`);
        const feeSats = Math.ceil(Number(estimate.routing_fee_msat) / 1000);
        console.log(`Routing Fee: ${feeSats} sats (${estimate.routing_fee_msat} msats)`);
        
        // Calculate fee percentage
        const feePercentage = (feeSats / Number(scenario.amount) * 100).toFixed(4);
        console.log(`Fee Percentage: ${feePercentage}%`);
        
        // Display routing information
        console.log('\nRouting Information:');
        console.log('-------------------');
        console.log(`Time Lock Delay: ${estimate.time_lock_delay} blocks`);
        
        // Analyze the results
        console.log('\nAnalysis:');
        console.log('---------');
        
        // Fee rate analysis
        if (Number(feePercentage) > 1) {
          console.log('⚠️ High fee rate detected! Consider finding a cheaper route.');
        } else if (Number(feePercentage) < 0.1) {
          console.log('✅ Low fee rate - this is a good route!');
        } else {
          console.log('ℹ️ Average fee rate for this payment size.');
        }
        
        // Time lock analysis
        if (Number(estimate.time_lock_delay) > 144) {
          console.log('⚠️ Long time lock period (>1 day). Consider a route with shorter lock time.');
        } else {
          console.log('✅ Reasonable time lock period.');
        }
        
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error estimating fees:', error.message);
        } else {
          console.error('Error estimating fees:', String(error));
        }
      }
    }
    
  } catch (error) {
    console.error('Error running fee estimation examples:', error);
  }
}

export default estimateRouteFeeExample; 