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

## Installation

```bash
npm install flndr
```

## Configuration

FLNDR can be configured using environment variables or direct configuration objects.

### Node.js Configuration

#### Option 1: Using Environment Variables

Create a `.env` file in your project root:

```
LND_REST_API_URL=https://your-lnd-node:8080
LND_MACAROON_PATH=/path/to/your/admin.macaroon
LND_TLS_CERT_PATH=/path/to/your/tls.cert
```

Or use raw values:

```
LND_REST_API_URL=https://your-lnd-node:8080
LND_MACAROON=0201036c6e6402f801030a1022a913... # Hex-encoded macaroon
LND_TLS_CERT=-----BEGIN CERTIFICATE-----\nMIIC... # Raw certificate content
```

#### Option 2: Direct Configuration

```typescript
import { LndClient } from 'flndr';

const lndClient = new LndClient({
  baseUrl: 'https://your-lnd-node:8080',
  macaroon: 'your-hex-encoded-macaroon',
  tlsCert: 'your-tls-cert-content', // Optional
});
```

#### Using Configuration Helpers

```typescript
import { getLndConfig, getLndConfigWithFallback } from 'flndr';

// Strict config (throws error if required variables are missing)
const strictConfig = getLndConfig();
const lndClient = new LndClient(strictConfig);

// With fallbacks for development (warns if variables are missing)
const devConfig = getLndConfigWithFallback();
const lndClient = new LndClient(devConfig);
```

### Browser Configuration

Since browsers don't have access to environment variables or the file system:

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

You can also inject configuration globally:

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

## Quick Start

```typescript
import { LndClient } from 'flndr';

// Create a client instance
const lnd = new LndClient({
  baseUrl: 'https://your-lnd-node:8080',
  macaroon: 'your-admin-macaroon-in-hex',
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

## API Reference

### LndClient Core Methods

These methods provide direct wrappers for the standard LND gRPC/REST API functionality.

#### Info Methods

- **getInfo()**: Get basic information about the LND node
- **channelBalance()**: Get information about channel balances
- **getNetwork()**: Get the Bitcoin network this client is connected to
- **isMainnet()**: Check if the client is connected to mainnet
- **isSignet()**: Check if the client is connected to signet

#### Invoice Methods

- **addInvoice(options)**: Create a new Lightning invoice
- **lookupInvoiceV2(paymentHash)**: Look up an invoice by its payment hash
  - Accepts payment hash in multiple formats:
    - Hex-encoded string
    - Standard base64 string
    - URL-safe base64 string
  - Automatically handles conversion to the format required by LND
- **listInvoices(options)**: List invoices with filtering and pagination

#### Payment Methods

- **listPayments(options)**: List outgoing payments with filtering and pagination
- **decodePayReq(payReq)**: Decode a payment request
- **estimateRouteFee(options)**: Estimate the fee for a payment (includes default 60-second timeout)
- **sendPaymentV2(options)**: Send a payment using the Lightning Network
  - Default behavior: Returns a single response with payment result (includes default 60-second timeout)
  - Streaming mode: Set `streaming: true` to receive real-time HTLC updates via WebSockets

### WebSocket Streaming Methods

FLNDR provides real-time streaming capabilities using WebSockets for various LND events:

- **subscribeInvoices(enableRetry?, maxRetries?, retryDelay?)**: Subscribe to all invoice updates
- **subscribeSingleInvoice(paymentHash, enableRetry?, maxRetries?, retryDelay?)**: Subscribe to updates for a specific invoice
- **trackPaymentByHash(paymentHash, enableRetry?, maxRetries?, retryDelay?)**: Track updates for a specific payment by hash
- **trackPaymentV2(noInflightUpdates?, enableRetry?, maxRetries?, retryDelay?)**: Track all outgoing payments

#### Enhanced WebSocket Features

The WebSocket implementation includes several advanced features:

- **Automatic URL-safe Base64 Encoding**: Payment hashes are automatically converted to the correct format for LND's API
- **Robust Message Parsing**: Handles LND's complex message formats, including nested JSON and result wrappers
- **Automatic Reconnection**: All streaming methods support configurable reconnection with exponential backoff
- **Connection Management**: Easily track and manage WebSocket connections
- **Comprehensive Error Handling**: Detailed error reporting helps diagnose connection issues

#### Running the Monitoring Examples

FLNDR includes examples demonstrating real-time monitoring capabilities:

```bash
# Run the streaming example for 60 seconds
npm run monitor streaming 60

# Run the mocked streaming example (no real LND required)
npm run monitor mocked

# Show all available monitoring examples
npm run monitor
```

See the [monitoring examples README](src/examples/monitoring/README.md) for more details on setting up and using real-time streaming.

#### Payment Tracking with sendPaymentV2

##### Default Mode (Single Response)
```typescript
// Regular request/response pattern
const paymentResult = await lndClient.sendPaymentV2({
  payment_request: 'lnbc...',
  // streaming: false (default)
});

// paymentResult contains final payment state
console.log('Payment status:', paymentResult.status);
```

##### Streaming Mode (Real-time Updates)
```typescript
// Listen for payment updates
lndClient.on('paymentUpdate', (update) => {
  console.log('Payment status:', update.status);
  
  if (update.status === 'SUCCEEDED') {
    console.log('Payment completed successfully!');
  } else if (update.status === 'FAILED') {
    console.log('Payment failed:', update.failure_reason);
  }
});

// Start payment with streaming enabled
const connectionUrl = await lndClient.sendPaymentV2({
  payment_request: 'lnbc...',
  streaming: true
});

// connectionUrl can be used later to close the connection
// lndClient.closeConnection(connectionUrl);
```

#### Connection Management

Methods to manage WebSocket connections:

```typescript
// Close a specific connection
lndClient.closeConnection(url);

// Close all active connections
lndClient.closeAllConnections();

// Check if a connection is active
const isActive = lndClient.isConnectionActive(url);

// Get the status of a connection
const status = lndClient.getConnectionStatus(url); // Returns 'CONNECTING', 'OPEN', 'CLOSING', 'CLOSED', or null
```

#### Reconnection Handling

All streaming methods support automatic reconnection:

```typescript
// Enable automatic reconnection with custom parameters
const url = lndClient.subscribeInvoices(
  true,           // enableRetry
  10,             // maxRetries
  2000            // retryDelay in ms
);

// The client will automatically attempt to reconnect if the connection is lost
// with exponential backoff (delay doubles after each retry)
```

## Network Support

FLNDR supports multiple Bitcoin networks:

- `mainnet`: Bitcoin mainnet (production)
- `regtest`: Bitcoin regtest (local testing)
- `signet`: Bitcoin signet (including MutinyNet)

The library automatically detects which network your LND node is running on:

```