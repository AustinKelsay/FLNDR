/**
 * FLNDR Examples
 * 
 * This file runs all the examples for the FLNDR SDK.
 * It demonstrates how to use the SDK to interact with an LND node's REST API.
 */

// Import dotenv to load environment variables
import 'dotenv/config';

import { LndClient } from '../index';
import { getLndConfigWithFallback } from '../utils/config';

// Info examples
import channelBalanceExample from './info/channelBalance';
import getInfoExample from './info/getInfo';
import networkDetectionExample from './info/networkDetectionExample';

// Invoice examples
import addInvoiceExample from './invoice/addInvoice';
import listInvoicesExample from './invoice/listInvoices';
import lookupInvoiceExample from './invoice/lookupInvoice';

// Payment examples
import decodePayReqExample from './payments/decodePayReq';
import estimateRouteFeeExample from './payments/estimateRouteFee';
import listPaymentsExample from './payments/listPayments';
import sendPaymentExample from './payments/sendPayment';

// Import the mocked streaming example (we cannot run it here because it creates long-running connections)
import mockedStreamingExample from './monitoring/mockedStreamingExample';

/**
 * Main entry point for running examples.
 * Run with: `npm run examples <exampleName>` or `npm run examples all`
 * Add new examples to the switch statement below.
 */
async function runExamples() {
  const exampleName = process.argv[2] || 'all';
  const lndClient = new LndClient(getLndConfigWithFallback());

  console.log(`Running example: ${exampleName === 'all' ? 'all examples' : exampleName}\n`);

  // Helper function to run an example and catch errors
  const run = async (name: string, exampleFn: (client: LndClient) => Promise<void>) => {
    if (exampleName === 'all' || exampleName === name) {
      try {
        console.log(`--- Running ${name} example ---`);
        await exampleFn(lndClient);
        console.log(`--- ${name} example completed ---\n`);
      } catch (error) {
        console.error(`Error in ${name} example:`, error);
      }
    }
  };

  // Dynamically run examples based on the argument
  switch (exampleName.toLowerCase()) {
    // Info examples
    case 'balance':
    case 'channelbalance':
      await run('channelBalance', channelBalanceExample);
      break;
    case 'info':
    case 'getinfo':
      await run('getInfo', getInfoExample);
      break;
    case 'network':
    case 'networkdetection':
      await run('networkDetection', networkDetectionExample);
      break;
    // Invoice examples
    case 'addinvoice':
      await run('addInvoice', addInvoiceExample);
      break;
    case 'listinvoices':
      await run('listInvoices', listInvoicesExample);
      break;
    case 'lookupinvoice':
      await run('lookupInvoice', lookupInvoiceExample);
      break;
    // Payment examples
    case 'decodepayreq':
      await run('decodePayReq', decodePayReqExample);
      break;
    case 'estimateroutefee':
      await run('estimateRouteFee', estimateRouteFeeExample);
      break;
    case 'listpayments':
      await run('listPayments', listPaymentsExample);
      break;
    case 'sendpayment':
      await run('sendPayment', sendPaymentExample);
      break;
    // Monitoring examples
    case 'mockedstreaming': // This one can be run directly
      await run('mockedStreaming', mockedStreamingExample);
      break;
    case 'all':
      // Info
      await run('channelBalance', channelBalanceExample);
      await run('getInfo', getInfoExample);
      await run('networkDetection', networkDetectionExample);
      // Invoices
      await run('addInvoice', addInvoiceExample);
      await run('listInvoices', listInvoicesExample);
      await run('lookupInvoice', lookupInvoiceExample);
      // Payments
      await run('decodePayReq', decodePayReqExample);
      await run('estimateRouteFee', estimateRouteFeeExample);
      await run('listPayments', listPaymentsExample);
      await run('sendPayment', sendPaymentExample);
      // Monitoring
      await run('mockedStreaming', mockedStreamingExample);
      console.log('Note: Real streaming examples (subscribeInvoices, trackPayment) need to be run manually via `npm run monitor streaming`.');
      break;
    default:
      console.log(
        `Unknown example: ${exampleName}. `, 
        `Available examples: balance, info, network, addinvoice, listinvoices, lookupinvoice, decodepayreq, estimateroutefee, listpayments, sendpayment, mockedstreaming, all`
      );
      console.log('See also: `npm run monitor` for streaming examples.');
  }

  // Close all connections when done (important for streaming examples)
  lndClient.closeAllConnections();
}

runExamples().catch(error => {
  console.error('Unhandled error running examples:', error);
});

export default runExamples; 