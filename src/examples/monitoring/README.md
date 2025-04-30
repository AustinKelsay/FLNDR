# FLNDR Monitoring Examples

This directory contains examples demonstrating the real-time monitoring capabilities of the FLNDR SDK through WebSocket connections.

## Overview

FLNDR provides powerful WebSocket streaming for Lightning Network events like invoice updates and payment tracking. These examples showcase different implementations and use cases for real-time monitoring.

## File Structure

- **index.ts** - Main entry point that exports all examples and provides a convenient API
- **run-monitor.ts** - CLI runner utility that handles execution of any example with auto-shutdown
- **mockedStreamingExample.ts** - Simulated streaming (no LND needed)
- **streamingExample.ts** - Advanced implementation with robust error handling

## Available Examples

### 1. Mocked Streaming Example (`mockedStreamingExample.ts`)

Simulated streaming for development/testing without requiring a real LND node:
- Simulates invoice creation and settlement
- Simulates payment sending and completion
- Works without any LND configuration
- Perfect for UI development and testing

```typescript
import { mockedStreamingExample } from 'flndr/examples/monitoring';
mockedStreamingExample();
```

### 2. Streaming Example (`streamingExample.ts`)

Advanced implementation with robust error handling and diagnostics:
- Comprehensive error handling and detailed logging
- Advanced reconnection logic
- WebSocket status reporting and diagnostics
- Detailed event parsing and formatting
- Connection troubleshooting features
- LND configuration validation

```typescript
import { streamingExample } from 'flndr/examples/monitoring';
streamingExample();
```

## Running the Examples

### Option 1: Using npm scripts

Run any example directly from the command line:

```bash
# Show available examples
npm run monitor

# Run specific examples (with optional duration in seconds)
npm run monitor mocked     # Run mocked example with default duration
npm run monitor streaming 60  # Run streaming example for 60 seconds

# Shorthand commands
npm run monitor:mocked     # Run mocked example
npm run monitor:streaming  # Run streaming example
npm run monitor:all        # Run all examples sequentially
```

### Option 2: Using the API

```typescript
import { default as monitoring } from 'flndr/examples/monitoring';

// Run examples directly
monitoring.mockedStreamingExample();
monitoring.streamingExample();

// Use aliases
monitoring.mocked();    // Same as mockedStreamingExample
monitoring.streaming(); // Same as streamingExample

// Use the run helper with auto-shutdown
await monitoring.run('mocked', 60);    // Run mocked example for 60 seconds
await monitoring.run('streaming', 45); // Run streaming example for 45 seconds
await monitoring.run('all', 20);       // Run all examples for 20 seconds each
```

## WebSocket Features Demonstrated

All examples showcase these core WebSocket features:

- **Event-Based Updates**: Real-time updates via event listeners
- **Automatic URL-safe Base64 Encoding**: Payment hashes properly formatted for LND
- **Robust Message Parsing**: Handles LND's complex message formats
- **Connection Management**: Track and close WebSocket connections
- **Error Handling**: Detailed error reporting
- **Automatic Reconnection**: Configurable reconnection with exponential backoff

## Environment Configuration

For the streaming example (which connects to a real LND node), you'll need:

```
LND_REST_API_URL=https://your-lnd-node:8080
LND_MACAROON_PATH=/path/to/your/admin.macaroon
# Or use the hex-encoded macaroon directly:
# LND_MACAROON=0201036c6e6402f801030a1022a913...
```

The mocked example doesn't require any configuration.

## LND WebSocket Endpoints Used

FLNDR uses the following LND WebSocket endpoints:

1. **Invoice Subscription**: `/v1/invoices/subscribe`
   - Receives real-time updates for all invoices
   - Requires `invoice:read` macaroon permission
   - Most reliable endpoint, typically works with all LND node types

2. **Single Invoice Subscription**: `/v2/invoices/subscribe/{r_hash}`
   - Receives updates for a specific invoice by payment hash
   - Payment hash must be URL-safe base64 encoded
   - Requires `invoice:read` macaroon permission

3. **Payment Tracking**: `/v2/router/track/{payment_hash}`
   - Tracks a specific outgoing payment by payment hash
   - May not be supported by all LND node providers (especially Voltage)
   - Requires `offchain:read` macaroon permission

4. **All Payments Tracking**: `/v2/router/trackpayments`
   - Tracks all outgoing payments in real-time
   - May not be supported by all LND node providers
   - Requires `offchain:read` macaroon permission

## Configuration

Examples use the `getLndConfigWithFallback()` function to get configuration from environment variables:

1. Create a `.env` file in your project root with:
```
LND_REST_API_URL=https://your-lnd-node:8080
LND_MACAROON_PATH=/path/to/your/admin.macaroon
LND_TLS_CERT_PATH=/path/to/your/tls.cert
```

2. Or use raw values:
```
LND_REST_API_URL=https://your-lnd-node:8080
LND_MACAROON=0201036c6e6402f801030a1022a913... # Hex-encoded macaroon
LND_TLS_CERT=-----BEGIN CERTIFICATE-----\nMIIC... # Raw certificate content
```

If environment variables are not set, the examples will use fallback values for demonstration purposes.

## Common Connection Issues

You may encounter these common WebSocket connection issues:

1. **Provider Limitations**: Some LND providers (like Voltage) may not support all WebSocket endpoints, particularly the payment tracking ones. The invoice endpoints typically work.

2. **Permission Errors**: Your macaroon might not have the necessary permissions for all endpoints. A read-only macaroon might work for invoice subscriptions but not payment tracking.

3. **Proxy/Firewall Issues**: Corporate firewalls, proxies, or certain hosting providers may block WebSocket connections.

4. **Format Issues**: The streaming example handles LND's complex message formats, including those wrapped in `result` objects, which helps avoid parsing errors.

## What You'll See

When running the examples:

1. Connection events (open, close, error)
2. Real-time invoice updates
3. Payment status changes (when available)
4. Automatic reconnection demonstrations (if enabled)

The examples automatically stop after the specified duration.

## Troubleshooting

If you encounter connection issues:

1. **Check your LND node's WebSocket support**: Not all LND providers support all WebSocket endpoints.
   
2. **Verify macaroon permissions**: Use an admin macaroon if possible, or ensure your macaroon has these permissions:
   - `invoice:read` for invoice monitoring
   - `offchain:read` for payment tracking

3. **Try the mocked example**: If you can't connect to a real LND node, the mocked example works without a connection.

4. **Examine the connection status report**: The streaming example displays detailed connection information.

5. **Review the debug logs**: Enable debug logging to see the raw WebSocket messages.

## Additional Features

- **Automatic Reconnection**: All examples demonstrate automatic WebSocket reconnection with configurable retry parameters
- **Event-driven Architecture**: Shows how to use event listeners for real-time updates
- **Error Handling**: Demonstrates proper error handling for WebSocket connections
- **Robust Message Parsing**: Handles LND's complex WebSocket message formats 