import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to retrieve channel balance information
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to retrieve channel balance information
 * - How to work with the different balance types
 */
async function channelBalanceExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    console.log('Fetching channel balance information...');
    const balance = await lndClient.channelBalance();
    
    console.log('\nChannel Balance Summary:');
    console.log('-----------------------');
    
    // Main balance values
    console.log(`Total Local Balance: ${balance.local_balance.sat} sats (${Number(balance.local_balance.sat) / 100000000} BTC)`);
    console.log(`Total Remote Balance: ${balance.remote_balance.sat} sats (${Number(balance.remote_balance.sat) / 100000000} BTC)`);
    
    // Unsettled funds (in-flight HTLCs)
    console.log(`\nUnsettled Funds (in-flight HTLCs):`);
    console.log(`Local Unsettled: ${balance.unsettled_local_balance.sat} sats`);
    console.log(`Remote Unsettled: ${balance.unsettled_remote_balance.sat} sats`);
    
    // Pending channels
    console.log(`\nPending Channels:`);
    console.log(`Total Pending: ${balance.pending_open_balance} sats`);
    console.log(`Pending Local Balance: ${balance.pending_open_local_balance.sat} sats`);
    console.log(`Pending Remote Balance: ${balance.pending_open_remote_balance.sat} sats`);
    
    // Calculate totals
    const totalLocalSats = Number(balance.local_balance.sat) + Number(balance.unsettled_local_balance.sat) + Number(balance.pending_open_local_balance.sat);
    const totalRemoteSats = Number(balance.remote_balance.sat) + Number(balance.unsettled_remote_balance.sat) + Number(balance.pending_open_remote_balance.sat);
    const totalSats = totalLocalSats + totalRemoteSats;
    
    console.log(`\nTotal Channel Capacity: ${totalSats} sats (${totalSats / 100000000} BTC)`);
    console.log(`Your Control (Local): ${totalLocalSats} sats (${(totalLocalSats / totalSats * 100).toFixed(2)}%)`);
    console.log(`Remote Control: ${totalRemoteSats} sats (${(totalRemoteSats / totalSats * 100).toFixed(2)}%)`);
    
  } catch (error) {
    console.error('Error fetching channel balance:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  channelBalanceExample().catch(console.error);
}

export default channelBalanceExample; 