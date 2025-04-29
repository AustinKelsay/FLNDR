import { LndClient } from '../..';
import { config } from 'dotenv';
import { Invoice, PaymentStatus, SendPaymentRequest } from '../../types/lnd';
import { getLndConfigWithFallback } from '../../utils/config';

// Load environment variables from .env file
config();

/**
 * Enhanced streaming example with improved error handling and debugging
 * to help troubleshoot WebSocket connection issues with LND
 */
async function enhancedStreamingExample() {
  let lndClient: LndClient | null = null;
  
  // Set up clean exit handling
  const cleanup = () => {
    console.log('\n🧹 Cleaning up connections and exiting...');
    if (lndClient) {
      lndClient.closeAllConnections();
      console.log('✅ All connections closed');
    }
    console.log('👋 Exiting gracefully');
    process.exit(0);
  };
  
  // Handle ctrl+c and other termination signals
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  try {
    console.log('🔍 FLNDR Enhanced Streaming Example');
    console.log('==================================================');
    
    // Get configuration from environment variables with fallback
    console.log('📋 Checking LND client configuration...');
    const lndConfig = getLndConfigWithFallback();
    
    // Print basic configuration (sanitized) for debugging
    console.log('\n🔑 Connection Configuration:');
    console.log(`• Host: ${lndConfig.baseUrl}`);
    console.log(`• Macaroon provided: ${lndConfig.macaroon ? '✅ Yes' : '❌ No'}`);
    if (lndConfig.macaroon) {
      // Only show the first and last 6 chars of the macaroon for security
      const macaroonPreview = lndConfig.macaroon.length > 15 
        ? `${lndConfig.macaroon.slice(0, 6)}...${lndConfig.macaroon.slice(-6)}`
        : '(Invalid format)';
      console.log(`• Macaroon preview: ${macaroonPreview}`);
    }
    console.log(`• TLS Certificate: ${lndConfig.tlsCert ? '✅ Provided' : '❌ Not provided'}`);
    
    // Check if we're using fallback configuration
    const usingFallback = lndConfig.baseUrl === 'https://your-lnd-node:8080';
    if (usingFallback) {
      console.log('\n⚠️ WARNING: Using fallback configuration values');
      console.log('This example will not work correctly with the fallback configuration.');
      console.log('Please configure your LND connection in .env file');
      
      // Ask if user wants to continue anyway
      console.log('\nDo you want to continue with fallback values anyway for testing? (y/N)');
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      // Wait for user input
      const answer = await new Promise(resolve => {
        process.stdin.once('data', (data) => {
          const input = data.toString().trim().toLowerCase();
          resolve(input === 'y' || input === 'yes');
        });
      });
      
      if (!answer) {
        console.log('Exiting as requested by user');
        process.exit(0);
      }
      
      console.log('Continuing with fallback values (expect connection errors)');
    }
    
    // Initialize the unified client
    console.log('\n🔄 Initializing LND client...');
    lndClient = new LndClient(lndConfig);
    console.log('✅ LND client initialized');
    
    // Verify connectivity by calling getInfo
    console.log('\n🔄 Testing LND connection with getInfo()...');
    try {
      const info = await lndClient.getInfo();
      console.log('✅ Successfully connected to LND node!');
      console.log(`• Node alias: ${info.alias}`);
      console.log(`• Node pubkey: ${info.identity_pubkey}`);
      console.log(`• Block height: ${info.block_height}`);
      console.log(`• Active channels: ${info.num_active_channels}`);
      console.log(`• LND version: ${info.version}`);
    } catch (error) {
      console.error('❌ Failed to connect to LND node:', error);
      console.log('\n⚠️ Cannot proceed with connection error. Please check your LND configuration.');
      cleanup();
      return;
    }
    
    // Set up event listeners for WebSocket events with more verbose logging
    console.log('\n📡 Setting up WebSocket event listeners...');
    
    // Connection opened handler
    lndClient.on('open', ({ url, reconnecting, attempt, reconnected }) => {
      if (reconnecting) {
        console.log(`🔄 Reconnecting to ${url}${attempt ? ` (attempt ${attempt})` : ''}`);
      } else if (reconnected) {
        console.log(`✅ Successfully reconnected to ${url}`);
      } else {
        console.log(`🔌 Connection opened to ${url}`);
      }
    });
    
    // Connection error handler with detailed logging
    lndClient.on('error', ({ url, error, message, reconnecting }) => {
      if (reconnecting) {
        console.error(`⚠️ Error during reconnection to ${url}: ${message || error.message}`);
      } else {
        console.error(`❌ WebSocket error from ${url}:`);
        console.error(`• Message: ${message || error.message}`);
        if (error.stack) {
          console.error(`• Stack: ${error.stack}`);
        }
      }
    });
    
    // Connection close handler with code interpretation
    lndClient.on('close', ({ url, code, reason, reconnecting }) => {
      const codeExplanation = getWebSocketCloseExplanation(code);
      if (reconnecting) {
        console.log(`🔄 Connection temporarily closed to ${url} (will retry)`);
      } else {
        console.log(`🔌 Connection closed to ${url}:`);
        console.log(`• Code: ${code} (${codeExplanation})`);
        console.log(`• Reason: ${reason || 'No reason provided'}`);
      }
    });
    
    // Invoice update handler
    lndClient.on('invoice', (invoice: Invoice) => {
      console.log('📝 Invoice update received:');
      console.log(`• Hash: ${invoice.r_hash}`);
      console.log(`• Amount: ${invoice.value || 0} sats`);
      console.log(`• State: ${invoice.state}`);
      console.log(`• Memo: ${invoice.memo}`);
      console.log('-'.repeat(40));
      
      if (invoice.state === 'SETTLED') {
        console.log('💰 Invoice settled!');
      }
    });
    
    // Single invoice update handler
    lndClient.on('singleInvoice', (invoice: Invoice) => {
      console.log('🧾 Single invoice update:');
      console.log(`• Hash: ${invoice.r_hash}`);
      console.log(`• State: ${invoice.state}`);
      console.log('-'.repeat(40));
    });
    
    // Payment update handler
    lndClient.on('paymentUpdate', (payment: PaymentStatus) => {
      console.log('💸 Payment update received:');
      console.log(`• Hash: ${payment.payment_hash}`);
      console.log(`• Status: ${payment.status}`);
      console.log(`• Amount: ${payment.value_sat || 0} sats`);
      console.log(`• Fee: ${payment.fee_sat || 0} sats`);
      
      if (payment.status === 'FAILED') {
        console.log(`• Failure reason: ${payment.failure_reason}`);
        console.log('❌ Payment failed!');
      } else if (payment.status === 'SUCCEEDED') {
        console.log('✅ Payment succeeded!');
      } else if (payment.status === 'IN_FLIGHT') {
        console.log('📤 Payment in flight');
      }
      
      console.log('-'.repeat(40));
    });
    
    // Attempt to subscribe to LND streams with more detailed logging
    // Use smaller retry settings to avoid flooding with reconnection attempts
    const maxRetries = 5;      // Maximum number of retry attempts
    const retryDelay = 5000;   // Base delay between retries (5 seconds)
    const enableRetry = true;  // Enable automatic reconnections
    
    console.log('\n1️⃣ Setting up invoice subscription:');
    console.log('-'.repeat(40));
    console.log(`• Max retries: ${maxRetries}`);
    console.log(`• Base retry delay: ${retryDelay}ms (increases exponentially)`);
    
    try {
      console.log('🔄 Subscribing to all invoices...');
      const invoiceSubUrl = lndClient.subscribeInvoices(enableRetry, maxRetries, retryDelay);
      console.log(`✅ Invoice subscription requested to ${invoiceSubUrl}`);
      
      // Wait a moment to see if the connection gets established
      await delay(2000);
      
      // Check connection status
      const invoiceStatus = lndClient.getConnectionStatus(invoiceSubUrl);
      if (invoiceStatus === 'OPEN') {
        console.log('✅ Invoice subscription connected successfully');
      } else {
        console.log(`⚠️ Invoice subscription status: ${invoiceStatus || 'Unknown'}`);
      }
    } catch (error) {
      console.error('❌ Failed to subscribe to invoices:', error);
    }
    
    // Only try creating a test invoice if we have verified connectivity
    if (!usingFallback) {
      try {
        console.log('\n2️⃣ Creating a test invoice:');
        console.log('-'.repeat(40));
        
        const invoice = await lndClient.addInvoice({
          memo: 'Test streaming service',
          value: '1000', // 1000 sats
          expiry: '3600', // 1 hour
        });
        
        console.log(`✅ Created invoice with payment hash: ${invoice.r_hash}`);
        console.log(`📋 Payment request: ${invoice.payment_request}`);
        
        // Subscribe to this specific invoice for updates
        console.log('\n3️⃣ Setting up single invoice subscription:');
        console.log('-'.repeat(40));
        console.log(`🔄 Subscribing to invoice with hash: ${invoice.r_hash}`);
        const singleInvoiceUrl = lndClient.subscribeSingleInvoice(invoice.r_hash, enableRetry, maxRetries, retryDelay);
        console.log(`✅ Single invoice subscription requested to ${singleInvoiceUrl}`);
        
        // Wait a moment to see if the connection gets established
        await delay(2000);
        
        // Check connection status
        const singleInvoiceStatus = lndClient.getConnectionStatus(singleInvoiceUrl);
        if (singleInvoiceStatus === 'OPEN') {
          console.log('✅ Single invoice subscription connected successfully');
        } else {
          console.log(`⚠️ Single invoice subscription status: ${singleInvoiceStatus || 'Unknown'}`);
        }
      } catch (error) {
        console.error('❌ Failed to create or track invoice:', error);
      }
    }
    
    // Final connection status report
    console.log('\n📊 Connection Status Report:');
    console.log('-'.repeat(40));
    
    // Loop through all connections and report their status
    let allConnectionsOk = true;
    const urls = getAllConnectionUrls(lndClient, lndConfig.baseUrl);
    
    for (const url of urls) {
      const status = lndClient.getConnectionStatus(url);
      const statusSymbol = status === 'OPEN' ? '✅' : '❌';
      console.log(`${statusSymbol} ${url}: ${status || 'Unknown'}`);
      if (status !== 'OPEN') {
        allConnectionsOk = false;
      }
    }
    
    if (!allConnectionsOk) {
      console.log('\n⚠️ Some connections are not open. Common reasons for WebSocket failures:');
      console.log('1. LND node is not configured to allow connections from your IP');
      console.log('2. Firewall or proxy blocking WebSocket connections');
      console.log('3. LND node is not configured with macaroon access for these endpoints');
      console.log('4. LND REST API proxy might not support WebSockets');
      console.log('5. TLS certificate verification issues');
      console.log('\nTroubleshooting tips:');
      console.log('• Check your LND node configuration');
      console.log('• Verify your macaroon has permission for invoice and router RPCs');
      console.log('• Try with TLS verification disabled (for testing only)');
      console.log('• Check if any proxy between you and LND supports WebSockets');
    }
    
    // Keep the process running to continue receiving updates
    console.log('\n🔄 Waiting for updates (Press Ctrl+C to exit)...');
    console.log('Any invoice or payment events will appear here...');
    console.log('-'.repeat(40));
    
    // The process will continue running until Ctrl+C is pressed
    
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    cleanup();
  }
}

/**
 * Gets a human-readable explanation of WebSocket close codes
 */
function getWebSocketCloseExplanation(code: number): string {
  const explanations: Record<number, string> = {
    1000: 'Normal closure',
    1001: 'Going away',
    1002: 'Protocol error',
    1003: 'Unsupported data',
    1004: 'Reserved',
    1005: 'No status received',
    1006: 'Abnormal closure (connection failed)',
    1007: 'Invalid frame payload data',
    1008: 'Policy violation',
    1009: 'Message too big',
    1010: 'Missing extension',
    1011: 'Internal error',
    1012: 'Service restart',
    1013: 'Try again later',
    1014: 'Bad gateway',
    1015: 'TLS handshake failure'
  };
  
  return explanations[code] || 'Unknown';
}

/**
 * Generate a list of all possible connection URLs for status checking
 */
function getAllConnectionUrls(client: LndClient, baseUrl: string): string[] {
  // These are the standard streaming endpoints used by LND
  return [
    `${baseUrl}/v1/invoices/subscribe`,
    `${baseUrl}/v2/router/trackpayments?no_inflight_updates=false`
  ];
}

/**
 * Helper function to pause execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the example if this file is executed directly
if (require.main === module) {
  enhancedStreamingExample().catch(error => {
    console.error('❌ Uncaught error in enhanced streaming example:', error);
    process.exit(1);
  });
}

// Export for use in other files
export default enhancedStreamingExample; 