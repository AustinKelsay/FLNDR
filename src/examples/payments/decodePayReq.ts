import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to decode Lightning payment requests
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to decode a payment request (bolt11 invoice)
 * - How to parse and analyze the decoded information
 */
async function decodePayReqExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    // Example payment requests - using test invoices
    const paymentRequests = [
      // Test invoice for 100 sats
      'lntbs100u1pn7c0z5pp55au6rk6pww0t6rnnenxzm7846csrm57xzuwtmkn0dr054nuh8syqdqqcqzzsxqyz5vqsp5jpp0y8qsqnlzuudvj0skgt6rhvrj93gnyvvvlvqvg80hul4nqwfq9qxpqysgqqs9qaa94cpsmeru39f8f83c264ammg2x6vk4m870ekps0dxn86730j2f5ujhlvlcx9h8cvw427ngnzd6vjqre2na4yzzqtrtxzw9czcqhclkjy',
      // Test invoice for 500 sats with memo
      'lntbs500u1pn7c0z5pp545ukqeqss4w842n6dh84k294etljlj864f5s4ssm7ntrelaxudxsdp02pshjmt9de6zqen0wgs8xetjwe5kxetnypex2mnyv4ex2eqcqzzsxqyz5vqsp52h37acjd6dphmef2r3jw24ys5jzrqudtm02uuxk43nd0gpuyvyxs9qxpqysgqwl8yvfleu9gjc5gnw4d7drg76rz55vyz2jpdsecna6wssrkpq2f97lga25krdpr9se3u5j6d4h3cwprfypl3vlf96fepwk4vsqz0gwqqhwq8m6'
    ];
    
    for (const [index, payReq] of paymentRequests.entries()) {
      console.log(`\nDecoding Payment Request #${index + 1}:`);
      console.log('-'.repeat(30));
      
      try {
        const decoded = await lndClient.decodePayReq(payReq);
        
        // Display basic information
        console.log('Basic Information:');
        console.log('------------------');
        console.log(`Amount: ${decoded.num_satoshis} sats (${decoded.num_msat} msats)`);
        console.log(`Description: ${decoded.description || '(no description)'}`);
        console.log(`Destination: ${decoded.destination}`);
        
        // Display timing information
        const timestamp = new Date(Number(decoded.timestamp) * 1000).toLocaleString();
        const expiryDate = new Date((Number(decoded.timestamp) + Number(decoded.expiry)) * 1000).toLocaleString();
        console.log('\nTiming:');
        console.log('-------');
        console.log(`Created: ${timestamp}`);
        console.log(`Expires: ${expiryDate}`);
        console.log(`Expiry Time: ${decoded.expiry} seconds`);
        
        // Display routing information
        console.log('\nRouting Information:');
        console.log('-------------------');
        console.log(`CLTV Expiry: ${decoded.cltv_expiry}`);
        
        if (decoded.route_hints && decoded.route_hints.length > 0) {
          console.log('\nRoute Hints:');
          console.log('------------');
          decoded.route_hints.forEach((hint, i) => {
            console.log(`\nHint #${i + 1}:`);
            hint.hop_hints.forEach((hop, j) => {
              console.log(`  Hop ${j + 1}:`);
              console.log(`    Node: ${hop.node_id}`);
              console.log(`    Channel: ${hop.chan_id}`);
              console.log(`    Fee Base (msat): ${hop.fee_base_msat}`);
              console.log(`    Fee Rate: ${hop.fee_proportional_millionths / 10000}%`);
              console.log(`    CLTV Delta: ${hop.cltv_expiry_delta}`);
            });
          });
        } else {
          console.log('No route hints provided');
        }
        
        // Display fallback address if present
        if (decoded.fallback_addr) {
          console.log('\nFallback Address:');
          console.log('----------------');
          console.log(decoded.fallback_addr);
        }
        
        // Display features if present
        if (Object.keys(decoded.features).length > 0) {
          console.log('\nFeatures:');
          console.log('---------');
          Object.entries(decoded.features).forEach(([key, feature]) => {
            console.log(`${feature.name}: Required=${feature.is_required}, Known=${feature.is_known}`);
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error:', error.message);
        } else {
          console.error('Error:', String(error));
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', String(error));
    }
  }
}

export default decodePayReqExample;