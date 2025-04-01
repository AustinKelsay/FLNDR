# FLNDR - Fast Lightning Network Devkit for Rookies

FLNDR is a TypeScript-based wrapper for the LND REST API, designed to simplify Lightning Network integration for enterprise applications. This SDK provides an easy, abstracted interface for common Lightning Network operations.

## Features

- Simple, promise-based API
- TypeScript support with full type definitions
- Lightweight with minimal dependencies
- Easy to integrate into existing applications
- Support for multiple Bitcoin networks (mainnet, signet (MutinyNet), regtest)
- Automatic network detection

## Installation

```bash
npm install flndr
```

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

#### Receiving Methods

- **addInvoice(options)**: Create a new Lightning invoice
- **lookupInvoiceV2(rHash)**: Look up an invoice by its payment hash
- **listInvoices(options)**: List invoices with filtering and pagination

#### Payment Methods

- **listPayments(options)**: List outgoing payments with filtering and pagination

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

### Receiving
- ✅ addInvoice
- ✅ lookupInvoiceV2
- ✅ listInvoices
- ✅ listPayments

### Sending
- decodePayReq (Coming soon)
- estimateRouteFee (Coming soon)
- sendPaymentV2 (Coming soon)

### Monitoring
- subscribeInvoices (Coming soon)
- subscribeSingleInvoice (Coming soon)
- TrackPayments (Coming soon)
- TrackPaymentV2 (Coming soon)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
