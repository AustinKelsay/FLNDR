import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating network auto-detection
 * 
 * This example shows:
 * - How to connect to an LND node with network auto-detection
 * - How to detect and check which network you're connected to
 * - How to handle different networks in your code
 */
async function networkDetectionExample() {
  console.log('Setting up LND connection...');
  
  // Get the LND configuration from environment variables
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance
  const lndClient = new LndClient(config);

  try {
    // Network detection happens automatically on the first call to any network-related method
    console.log('Fetching node information and detecting network...');
    const info = await lndClient.getInfo();
    
    console.log('\nNode Details:');
    console.log('------------');
    console.log(`Node Alias: ${info.alias}`);
    console.log(`Node Public Key: ${info.identity_pubkey}`);
    console.log(`Connected to blockchain: ${info.chains[0].chain} ${info.chains[0].network}`);
    
    // Check which network we're on
    console.log('\nNetwork Detection:');
    console.log('-----------------');
    console.log(`Auto-detected network: ${await lndClient.getNetwork()}`);
    console.log(`Is Mainnet: ${await lndClient.isMainnet()}`);
    console.log(`Is Signet: ${await lndClient.isSignet()}`);
    
    // Example of network-specific behavior
    if (await lndClient.isSignet()) {
      console.log('\nYou are connected to Signet!');
      console.log('This is great for development and testing.');
    } else if (await lndClient.isMainnet()) {
      console.log('\nYou are connected to Mainnet.');
      console.log('This is the production Bitcoin network.');
    } else {
      console.log(`\nYou are connected to ${await lndClient.getNetwork()}.`);
    }
    
  } catch (error) {
    console.error('Error connecting to LND node:', error);
    console.log('\nTo set up LND access:');
    console.log('1. Make sure your LND node is running');
    console.log('2. Configure the environment variables in your .env file:');
    console.log('   - LND_REST_API_URL');
    console.log('   - LND_MACAROON or LND_MACAROON_PATH');
    console.log('   - LND_TLS_CERT_PATH (if needed)');
  }
}

// Export the example function
export default networkDetectionExample; 