import { LndClient } from '../..';
import { EventEmitter } from 'events';
import { Invoice, PaymentStatus } from '../../types/lnd';

// Mock streaming example to demonstrate the unified LndClient without requiring an actual LND node
async function mockedStreamingExample() {
  console.log('🔍 FLNDR Unified Client - Mock Streaming Example');
  console.log('='.repeat(50));
  
  // Create a mock client that extends EventEmitter to simulate events
  class MockLndClient extends LndClient {
    constructor() {
      // Pass mock configuration
      super({
        baseUrl: 'https://mock-lnd-server.com',
        macaroon: 'mock-macaroon'
      });
    }
    
    // Override streaming methods to simulate connections
    subscribeInvoices(): string {
      console.log('✅ Subscribing to all invoices...');
      const url = 'https://mock-lnd-server.com/v1/invoices/subscribe';
      
      // Simulate connection opening
      setTimeout(() => {
        this.emit('open', { url });
        console.log('🔌 Connection opened to invoice stream');
        
        // Simulate receiving invoice updates
        setTimeout(() => {
          const invoice: Invoice = {
            memo: 'Test invoice',
            r_preimage: 'preimage123',
            r_hash: 'hash123',
            value: '1000',
            value_msat: '1000000',
            settled: false,
            creation_date: Date.now().toString(),
            settle_date: '',
            payment_request: 'lntb1000n...',
            description_hash: '',
            expiry: '3600',
            fallback_addr: '',
            cltv_expiry: '144',
            route_hints: [],
            private: false,
            add_index: '123',
            settle_index: '',
            amt_paid: '0',
            amt_paid_sat: '0',
            amt_paid_msat: '0',
            state: 'OPEN',
            htlcs: [],
            features: {},
            is_keysend: false,
            payment_addr: 'addr123',
            is_amp: false
          };
          
          this.emit('invoice', invoice);
          console.log('📝 Received invoice update');
          
          // Simulate invoice being paid
          setTimeout(() => {
            invoice.state = 'SETTLED';
            invoice.settled = true;
            invoice.settle_date = Date.now().toString();
            invoice.amt_paid = '1000';
            invoice.amt_paid_sat = '1000';
            invoice.amt_paid_msat = '1000000';
            
            this.emit('invoice', invoice);
            console.log('💰 Invoice settled!');
          }, 3000);
        }, 1000);
      }, 500);
      
      return url;
    }
    
    trackPaymentV2(): string {
      console.log('✅ Subscribing to payment updates...');
      const url = 'https://mock-lnd-server.com/v2/router/trackpayments';
      
      // Simulate connection opening
      setTimeout(() => {
        this.emit('open', { url });
        console.log('🔌 Connection opened to payment stream');
        
        // Simulate payment updates
        setTimeout(() => {
          const payment: PaymentStatus = {
            payment_hash: 'payhash456',
            status: 'IN_FLIGHT',
            creation_date: Date.now().toString(),
            htlcs: [],
            value: '2000',
            value_sat: '2000',
            value_msat: '2000000',
            payment_request: 'lntb2000n...',
            payment_preimage: '',
            fee: '0',
            fee_sat: '0',
            fee_msat: '0',
            creation_time_ns: '1234567890',
            inflight: true,
            failure_reason: 'FAILURE_REASON_NONE'
          };
          
          this.emit('paymentUpdate', payment);
          console.log('📤 Payment in flight');
          
          // Simulate payment succeeding
          setTimeout(() => {
            payment.status = 'SUCCEEDED';
            payment.inflight = false;
            payment.payment_preimage = 'preimage456';
            payment.fee = '20';
            payment.fee_sat = '20';
            payment.fee_msat = '20000';
            
            this.emit('paymentUpdate', payment);
            console.log('✅ Payment succeeded!');
          }, 3000);
        }, 1500);
      }, 700);
      
      return url;
    }
    
    // Override close methods to simulate closing
    closeConnection(url: string): void {
      setTimeout(() => {
        this.emit('close', { url, code: 1000, reason: 'Normal closure' });
        console.log(`🔌 Connection closed: ${url}`);
      }, 100);
    }
    
    closeAllConnections(): void {
      setTimeout(() => {
        this.emit('close', { 
          url: 'https://mock-lnd-server.com/v1/invoices/subscribe', 
          code: 1000, 
          reason: 'Normal closure'
        });
        this.emit('close', { 
          url: 'https://mock-lnd-server.com/v2/router/trackpayments', 
          code: 1000, 
          reason: 'Normal closure'
        });
        console.log('🔌 All connections closed');
      }, 100);
    }
  }
  
  // Create the mocked client
  const lndClient = new MockLndClient();
  
  // Set up event listeners for streaming events
  lndClient.on('open', ({ url }) => {
    console.log(`Event: Connection opened to ${url}`);
  });
  
  lndClient.on('error', ({ url, error, message }) => {
    console.error(`Event: Error from ${url}: ${message || error.message}`);
  });
  
  lndClient.on('close', ({ url, code, reason }) => {
    console.log(`Event: Connection closed to ${url} with code ${code} and reason: ${reason}`);
  });
  
  // Listen for invoice updates
  lndClient.on('invoice', (invoice: Invoice) => {
    console.log('Event: Invoice update received:');
    console.log(`- Hash: ${invoice.r_hash}`);
    console.log(`- Amount: ${invoice.value} sats`);
    console.log(`- State: ${invoice.state}`);
    console.log(`- Memo: ${invoice.memo}`);
    console.log('-------------------');
  });
  
  // Listen for payment updates
  lndClient.on('paymentUpdate', (payment: PaymentStatus) => {
    console.log('Event: Payment update received:');
    console.log(`- Hash: ${payment.payment_hash}`);
    console.log(`- Status: ${payment.status}`);
    console.log(`- Amount: ${payment.value_sat} sats`);
    console.log(`- Fee: ${payment.fee_sat} sats`);
    console.log('-------------------');
  });
  
  try {
    // Start subscriptions
    console.log('\n1️⃣ Starting subscriptions:');
    console.log('-'.repeat(50));
    
    const invoiceSubUrl = lndClient.subscribeInvoices();
    const paymentSubUrl = lndClient.trackPaymentV2();
    
    // Keep process running for simulation
    console.log('\n2️⃣ Waiting for events:');
    console.log('-'.repeat(50));
    console.log('✨ Watch the updates come in...');
    
    // Set a timeout to close connections after some time
    setTimeout(() => {
      console.log('\n3️⃣ Closing connections:');
      console.log('-'.repeat(50));
      lndClient.closeAllConnections();
      
      // Exit after everything is done
      setTimeout(() => {
        console.log('\n✅ Simulation complete!');
        console.log('='.repeat(50));
        console.log('This example demonstrated the unified LndClient that combines:');
        console.log('- Regular REST API methods');
        console.log('- WebSocket streaming capabilities');
        console.log('All in one convenient client!');
      }, 500);
    }, 10000);
    
  } catch (error) {
    console.error('Error in streaming example:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  mockedStreamingExample().catch(console.error);
}

// Export for use in other files
export default mockedStreamingExample; 