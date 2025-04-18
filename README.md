# FLNDR - Fast Lightning Network Devkit for Rookies

FLNDR is a TypeScript-based wrapper for the LND REST API, designed to simplify Lightning Network integration for enterprise applications. This SDK provides an easy, abstracted interface for common Lightning Network operations.

## Features

- Simple, promise-based API
- TypeScript support with full type definitions
- Lightweight with minimal dependencies
- Easy to integrate into existing applications
- Support for multiple Bitcoin networks (mainnet, signet (MutinyNet), regtest)
- Automatic network detection
- **Browser compatible** - works in both Node.js and browser environments

## Configuration

FLNDR can be configured using environment variables for secure access to your LND node. Create a `.env` file in your project root with the following variables:

### Option 1: Using File Paths

```
LND_REST_API_URL=https://your-lnd-node:8080
LND_MACAROON_PATH=/path/to/your/admin.macaroon
LND_TLS_CERT_PATH=/path/to/your/tls.cert
```

### Option 2: Using Raw Values

```
LND_REST_API_URL=https://your-lnd-node:8080
LND_MACAROON=0201036c6e6402f801030a1022a913... # Hex-encoded macaroon
LND_TLS_CERT=-----BEGIN CERTIFICATE-----\nMIIC... # Raw certificate content
```

You can mix and match these approaches as needed for your environment.

Alternatively, you can directly provide the configuration when instantiating the client:

```typescript
import { LndClient } from 'flndr';

const lndClient = new LndClient({
  baseUrl: 'https://your-lnd-node:8080',
  macaroon: 'your-hex-encoded-macaroon',
  tlsCert: 'your-tls-cert-content', // Optional
});
```

## Browser Compatibility

FLNDR is designed to work in both Node.js and browser environments. When using in browsers, there are a few important considerations:

### Configuration in Browsers

Since browsers don't have access to environment variables or the file system, you'll need to configure the client directly:

```typescript
import { LndClient, getLndBrowserConfig } from 'flndr';

// Option 1: Configure directly
const lndClient = new LndClient({
  baseUrl: 'https://your-lnd-proxy:8080', // Usually via a proxy to avoid CORS issues
  macaroon: 'your-hex-encoded-macaroon',
  network: 'mainnet'
});

// Option 2: Use the browser config utility
const config = getLndBrowserConfig({
  baseUrl: 'https://your-lnd-proxy:8080',
  macaroon: 'your-hex-encoded-macaroon'
});
const lndClient = new LndClient(config);
```

### Global Configuration

You can also inject the configuration globally for browser environments:

```html
<script>
  window.lndConfig = {
    baseUrl: 'https://your-lnd-proxy:8080',
    macaroon: 'your-hex-encoded-macaroon',
    network: 'mainnet'
  };
</script>
```

Then in your application:

```typescript
import { LndClient, getLndBrowserConfig } from 'flndr';

// Will use the window.lndConfig values
const config = getLndBrowserConfig();
const lndClient = new LndClient(config);
```

### WebSocket Connections in Browsers

For WebSocket streaming connections, browsers cannot set custom headers in the WebSocket constructor. This means you'll need a proxy server that:

1. Accepts the WebSocket connection from the browser
2. Adds the macaroon authentication header
3. Forwards the connection to your LND node

For local development, you can use tools like [cors-anywhere](https://github.com/Rob--W/cors-anywhere/) or set up a dedicated proxy with Express.js.

## Quick Start

```typescript
import { LndClient } from 'flndr';

// Create a client instance
const lnd = new LndClient({
  baseUrl: 'https://your-lnd-node:8080',
  macaroon: 'your-admin-macaroon-in-hex', // hex encoded macaroon
});

// Get node info
async function getNodeInfo() {
  try {
    const info = await lnd.getInfo();
    console.log(`Connected to ${info.alias} (${info.identity_pubkey})`);
    console.log(`Active channels: ${info.num_active_channels}`);
    
    // Check which network we're connected to
    console.log(`Network: ${await lnd.getNetwork()}`);
    console.log(`Is mainnet: ${await lnd.isMainnet()}`);
    console.log(`Is signet: ${await lnd.isSignet()}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

getNodeInfo();
```

## Network Support

FLNDR supports multiple Bitcoin networks and automatically detects which network your node is running on:

- `mainnet`: Bitcoin mainnet (production)
- `regtest`: Bitcoin regtest (local testing)
- `signet`: Bitcoin signet (including MutinyNet)

### Auto-detection

The library will automatically determine which network your LND node is running on by checking the chain information returned from the node:

```typescript
import { LndClient, getLndConfigWithFallback } from 'flndr';

const config = getLndConfigWithFallback();
const lndClient = new LndClient(config);

async function checkNetwork() {
  // Auto-detects the network when any of these methods are called
  console.log(`Network: ${await lndClient.getNetwork()}`);
  console.log(`Is mainnet: ${await lndClient.isMainnet()}`);
  console.log(`Is signet: ${await lndClient.isSignet()}`);
}

checkNetwork();
```

## Examples

The SDK includes a variety of examples that demonstrate how to interact with an LND node through the REST API.

### Setting up for examples

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your LND node's connection details:
   ```
   LND_REST_API_URL=https://your-lnd-node:8080
   LND_MACAROON_PATH=/path/to/your/admin.macaroon
   LND_TLS_CERT_PATH=/path/to/your/tls.cert
   ```

### Running examples

You can run all examples with:
```bash
npm run examples
```

Individual examples can be found in the `src/examples/` directory and can be run directly with ts-node:
```bash
npx ts-node src/examples/info/getInfo.ts
```

Network detection example:
```bash
npx ts-node src/examples/info/networkDetectionExample.ts
```

## Tests

The SDK includes comprehensive tests for all implemented methods. Run the tests with:

```bash
npm test
```

## API Documentation

### LndClient

The main class for interacting with the LND REST API.

```typescript
import { LndClient } from 'flndr';

// Initialize with direct configuration
const lndClient = new LndClient({
  baseUrl: 'https://your-lnd-node:8080',
  macaroon: 'your-hex-encoded-macaroon',
  tlsCert: 'your-tls-cert-content', // Optional
});

// Or initialize using environment variables
import { getLndConfigWithFallback } from 'flndr';
const config = getLndConfigWithFallback();
const lndClient = new LndClient(config);
```

#### Info Methods

- **getInfo()**: Get basic information about the LND node
- **channelBalance()**: Get information about channel balances
- **getNetwork()**: Get the Bitcoin network this client is connected to
- **isMainnet()**: Check if the client is connected to mainnet
- **isSignet()**: Check if the client is connected to signet

#### Receiving Methods

- **addInvoice(options)**: Create a new Lightning invoice
- **lookupInvoiceV2(paymentHash)**: Look up an invoice by its payment hash
- **listInvoices(options)**: List invoices with filtering and pagination

#### Payment Methods

- **listPayments(options)**: List outgoing payments with filtering and pagination
- **decodePayReq(payReq)**: Decode a payment request
- **estimateRouteFee(options)**: Estimate the fee for a payment
- **sendPaymentV2(options)**: Send a payment using the Lightning Network

#### Monitoring Methods

- **subscribeInvoices(enableRetry?, maxRetries?, retryDelay?)**: Subscribe to invoice updates
- **subscribeSingleInvoice(paymentHash, enableRetry?, maxRetries?, retryDelay?)**: Subscribe to a single invoice update
- **trackPayments(paymentHash, enableRetry?, maxRetries?, retryDelay?)**: Track payments with specific payment hash
- **trackPaymentV2(noInflightUpdates?, enableRetry?, maxRetries?, retryDelay?)**: Track all outgoing payments

### Configuration Utility

You can use the configuration utility to manage LND connection details:

```typescript
import { getLndConfig, getLndConfigWithFallback } from 'flndr';

// Get configuration from environment variables (throws error if required variables are missing)
const strictConfig = getLndConfig();

// Get configuration with fallbacks for development (warns if variables are missing)
const devConfig = getLndConfigWithFallback();
```

## Implemented Features

### Info
- ✅ getInfo
- ✅ channelBalance
- ✅ getNetwork
- ✅ isMainnet
- ✅ isSignet

### Receiving
- ✅ addInvoice
- ✅ lookupInvoiceV2
- ✅ listInvoices

### Payments
- ✅ listPayments
- ✅ decodePayReq
- ✅ estimateRouteFee
- ✅ sendPaymentV2

### Monitoring
- ✅ subscribeInvoices
- ✅ subscribeSingleInvoice
- ✅ trackPayments
- ✅ trackPaymentV2

## License

MIT

### Using in Browsers

You can import FLNDR in browsers using different methods:

#### Using npm and bundlers (Webpack, Rollup, etc.)

```bash
npm install flndr
```

Then import the browser version:

```javascript
// ESM import (recommended)
import { LndClient, getLndBrowserConfig } from 'flndr';

// Or using require with a bundler that supports it
const { LndClient, getLndBrowserConfig } = require('flndr/browser');
```

#### Using a CDN

For quick prototypes, you can load FLNDR directly from a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/flndr@1.0.0/dist/browser.min.js"></script>
<script>
  // FLNDR is available as a global variable
  const { LndClient } = FLNDR;
  
  const lndClient = new LndClient({
    baseUrl: 'https://your-lnd-proxy:8080',
    macaroon: 'your-hex-encoded-macaroon'
  });
  
  // Use the client as normal
  lndClient.getInfo()
    .then(info => console.log(info))
    .catch(err => console.error(err));
</script>
```

### Browser CORS Considerations

When using FLNDR in a browser, you'll likely encounter Cross-Origin Resource Sharing (CORS) restrictions when trying to connect directly to an LND REST API. To address this, consider:

1. Setting up a proxy server with proper CORS headers
2. Using a serverless function as a proxy
3. If it's a controlled environment, configuring your LND node to allow CORS requests

Example Express.js proxy server:

```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// LND proxy endpoint
app.use('/lnd/*', async (req, res) => {
  try {
    const lndUrl = 'https://your-lnd-node:8080' + req.url.replace('/lnd', '');
    const response = await axios({
      method: req.method,
      url: lndUrl,
      data: req.body,
      headers: {
        'Grpc-Metadata-macaroon': 'your-macaroon-hex'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to LND:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  }
});

app.listen(3000, () => {
  console.log('LND proxy server running on port 3000');
});
```

Then in your browser code:

```javascript
const lndClient = new LndClient({
  baseUrl: 'http://localhost:3000/lnd', // Point to your proxy
  macaroon: '' // Macaroon is handled by the proxy
});
```

## Network Support

FLNDR supports multiple Bitcoin networks and automatically detects which network your node is running on:

- `mainnet`: Bitcoin mainnet (production)
- `regtest`: Bitcoin regtest (local testing)
- `signet`: Bitcoin signet (including MutinyNet)

### Auto-detection

The library will automatically determine which network your LND node is running on by checking the chain information returned from the node:

```typescript
import { LndClient, getLndConfigWithFallback } from 'flndr';

const config = getLndConfigWithFallback();
const lndClient = new LndClient(config);

async function checkNetwork() {
  // Auto-detects the network when any of these methods are called
  console.log(`Network: ${await lndClient.getNetwork()}`);
  console.log(`Is mainnet: ${await lndClient.isMainnet()}`);
  console.log(`Is signet: ${await lndClient.isSignet()}`);
}

checkNetwork();
```

