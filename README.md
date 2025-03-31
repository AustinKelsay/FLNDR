# FLNDR - Fast Lightning Network Devkit for Rookies

FLNDR is a TypeScript-based wrapper for the LND REST API, designed to simplify Lightning Network integration for enterprise applications. This SDK provides an easy, abstracted interface for common Lightning Network operations.

## Features

- Simple, promise-based API
- TypeScript support with full type definitions
- Lightweight with minimal dependencies
- Easy to integrate into existing applications

## Installation

```bash
npm install flndr
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
  } catch (error) {
    console.error('Error:', error);
  }
}

getNodeInfo();
```

## API Documentation

### Connection

To create a new LND client:

```typescript
const lnd = new LndClient({
  baseUrl: 'https://your-lnd-node:8080', // LND REST API endpoint
  macaroon: 'hex-encoded-macaroon',      // Admin macaroon in HEX format
  tlsCert: 'optional-tls-cert',          // Optional TLS certificate
});
```

### Info Methods

#### getInfo()

Returns basic information about the connected LND node.

```typescript
const info = await lnd.getInfo();
```

Response:
```typescript
{
  version: string;         // LND version
  identity_pubkey: string; // Node public key
  alias: string;           // Node alias
  num_active_channels: number; // Number of active channels
  num_peers: number;       // Number of connected peers
  block_height: number;    // Current block height
  // ... other fields
}
```

#### channelBalance()

Returns the sum of funds held in all open channels.

```typescript
const balance = await lnd.channelBalance();
```

Response:
```typescript
{
  balance: string;         // Total balance in satoshis
  pending_open_balance: string;  // Balance in pending channels
  local_balance: {
    sat: string;           // Local balance in satoshis
    msat: string;          // Local balance in millisatoshis
  };
  remote_balance: {
    sat: string;           // Remote balance in satoshis
    msat: string;          // Remote balance in millisatoshis
  };
  // ... other fields
}
```

### Receiving Methods

#### addInvoice(request)

Creates a new Lightning invoice.

```typescript
const invoiceRequest = {
  memo: 'Payment for service',
  value: '10000', // 10,000 satoshis
  expiry: '3600', // 1 hour
};

const invoice = await lnd.addInvoice(invoiceRequest);
```

Response:
```typescript
{
  r_hash: string;          // Payment hash
  payment_request: string; // BOLT11 encoded payment request
  add_index: string;       // Invoice index
  payment_addr: string;    // Payment address
}
```

#### lookupInvoiceV2(r_hash_str)

Retrieves detailed information about a specific invoice by payment hash.

```typescript
const invoice = await lnd.lookupInvoiceV2('payment_hash_string');
```

Response includes detailed invoice information including state, payment details, and more.

#### listPayments(request)

Returns a paginated list of outgoing payments with detailed status information.

```typescript
const payments = await lnd.listPayments({
  max_payments: 10,
  include_incomplete: true
});
```

Response:
```typescript
{
  payments: Payment[];     // Array of payment objects
  first_index_offset: string;
  last_index_offset: string;
  total_num_payments: string;
}
```

## Implemented Features

### Info
- ✅ getInfo
- ✅ channelBalance

### Receiving
- ✅ addInvoice
- ✅ lookupInvoiceV2
- ✅ listPayments

### Sending
- decodePayReq (Coming soon)
- estimateRouteFee (Coming soon)
- sendPaymentV2 (Coming soon)
- listPayments (Already implemented in Receiving section)

### Monitoring
- subscribeInvoices (Coming soon)
- subscribeSingleInvoice (Coming soon)
- TrackPayments (Coming soon)
- TrackPaymentV2 (Coming soon)

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
