import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';

/**
 * Example demonstrating how to list Lightning invoices
 * 
 * This example shows:
 * - How to connect to an LND node
 * - How to list invoices with various filtering options
 * - How to parse and analyze the invoice data
 */
async function listInvoicesExample() {
  // Load LND config from environment variables with fallback to example values
  const config = getLndConfigWithFallback();
  
  // Create a new LndClient instance with the config
  const lndClient = new LndClient(config);

  try {
    // Get all invoices (with default pagination)
    console.log('Listing all invoices:');
    const allInvoices = await lndClient.listInvoices();
    console.log(`Found ${allInvoices.invoices.length} invoices in total`);
    
    // Calculate total amount of all paid invoices
    const paidAmount = allInvoices.invoices
      .filter(inv => inv.settled)
      .reduce((sum, inv) => sum + Number(inv.value), 0);
      
    console.log(`Total amount of paid invoices: ${paidAmount} sats`);
    
    // Count pending invoices
    const pendingInvoices = allInvoices.invoices
      .filter(inv => !inv.settled && inv.state === 'OPEN');
    
    console.log(`Number of pending invoices: ${pendingInvoices.length}`);
    
    // Display the most recent 3 invoices
    console.log('\nMost recent invoices:');
    console.log('--------------------');
    
    const recentInvoices = [...allInvoices.invoices]
      .sort((a, b) => Number(b.creation_date) - Number(a.creation_date))
      .slice(0, 3);
      
    recentInvoices.forEach((invoice, i) => {
      const date = new Date(Number(invoice.creation_date) * 1000).toLocaleString();
      console.log(`\nInvoice #${i + 1}:`);
      console.log(`  Created: ${date}`);
      console.log(`  Amount: ${invoice.value} sats`);
      console.log(`  Memo: ${invoice.memo || '(no memo)'}`);
      console.log(`  State: ${invoice.state}`);
      console.log(`  Payment Request: ${invoice.payment_request.substring(0, 30)}...`);
    });
    
    // List only settled invoices
    console.log('\nListing only settled (paid) invoices:');
    const settledInvoices = await lndClient.listInvoices({
      reversed: true, 
      pending_only: false,
      num_max_invoices: 5,
    });
    
    console.log(`Found ${settledInvoices.invoices.length} settled invoices`);
    
    // Advanced analysis: Monthly invoice revenue 
    // (in a real application, you might want more extensive date handling)
    console.log('\nMonthly Revenue Summary:');
    console.log('----------------------');
    
    const monthlyRevenue = new Map();
    
    allInvoices.invoices
      .filter(inv => inv.settled)
      .forEach(invoice => {
        const date = new Date(Number(invoice.creation_date) * 1000);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        const currentAmount = monthlyRevenue.get(monthYear) || 0;
        monthlyRevenue.set(monthYear, currentAmount + Number(invoice.value));
      });
    
    // Display monthly revenue
    for (const [monthYear, amount] of monthlyRevenue.entries()) {
      console.log(`${monthYear}: ${amount} sats`);
    }
    
  } catch (error) {
    console.error('Error listing invoices:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  listInvoicesExample().catch(console.error);
}

export default listInvoicesExample; 