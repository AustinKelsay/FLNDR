import { LndClient } from '../services/lndClient';

// Example of using the LndClient to get node info
async function main() {
  // Create a new LndClient instance with your LND REST connection details
  const lndClient = new LndClient({
    baseUrl: 'https://your-lnd-node:8080',
    macaroon: 'your-admin-macaroon-hex-here', // hex encoded macaroon
  });

  try {
    // Call getInfo method
    const info = await lndClient.getInfo();
    console.log('LND Node Info:', info);
    console.log(`Node pubkey: ${info.identity_pubkey}`);
    console.log(`Alias: ${info.alias}`);
    console.log(`Active channels: ${info.num_active_channels}`);
    console.log(`LND version: ${info.version}`);
  } catch (error) {
    console.error('Error fetching LND info:', error);
  }
}

// Run the example
main().catch(console.error); 