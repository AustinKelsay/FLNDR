import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to get information about your LND node
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to retrieve basic node information
 * - How to handle the response data
 */
async function getInfoExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    console.log('Fetching LND node information...');
    const info = await lndClient.getInfo();
    
    console.log('\nLND Node Details:');
    console.log('------------------');
    console.log(`Node Alias: ${info.alias}`);
    console.log(`Node Public Key: ${info.identity_pubkey}`);
    console.log(`LND Version: ${info.version} (${info.commit_hash})`);
    console.log(`Connected to network: ${info.chains[0].network}`);
    
    console.log('\nChannel Information:');
    console.log('--------------------');
    console.log(`Active Channels: ${info.num_active_channels}`);
    console.log(`Inactive Channels: ${info.num_inactive_channels}`);
    console.log(`Pending Channels: ${info.num_pending_channels}`);
    
    console.log('\nNode Status:');
    console.log('------------');
    console.log(`Connected Peers: ${info.num_peers}`);
    console.log(`Synced to Chain: ${info.synced_to_chain ? 'Yes' : 'No'}`);
    console.log(`Synced to Graph: ${info.synced_to_graph ? 'Yes' : 'No'}`);
    console.log(`Current Block Height: ${info.block_height}`);
    
    if (info.uris && info.uris.length > 0) {
      console.log('\nNode URIs:');
      console.log('---------');
      info.uris.forEach(uri => console.log(uri));
    }
    
  } catch (error) {
    console.error('Error fetching node information:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  getInfoExample().catch(console.error);
}

export default getInfoExample; 