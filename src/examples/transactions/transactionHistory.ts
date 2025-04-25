/**
 * Transaction History Example
 * 
 * This example demonstrates how to use the listTransactionHistory method
 * to display a unified transaction history with filtering and pagination.
 */

import { LndClient } from '../../services/lndClient';
import { getLndConfigWithFallback } from '../../utils/config';
import { Transaction, TransactionStatus, TransactionType } from '../../types/lnd';

// Create an instance of the LND client with fallback config
const lndClient = new LndClient(getLndConfigWithFallback());

/**
 * Format amount with sats unit
 */
function formatAmount(amount: number): string {
  return `${amount.toLocaleString()} sats`;
}

/**
 * Format timestamp to human-readable date/time
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Get a human-readable status for display
 */
function getStatusLabel(status: TransactionStatus): string {
  const statusMap: Record<TransactionStatus, string> = {
    'succeeded': '✅ Sent Successfully',
    'failed': '❌ Failed',
    'in_flight': '🔄 In Progress',
    'pending': '⏳ Pending',
    'settled': '✅ Received',
    'accepted': '🤝 Accepted',
    'canceled': '❌ Canceled',
    'expired': '⏰ Expired'
  };
  return statusMap[status] || status;
}

/**
 * Get icon for transaction type
 */
function getTypeIcon(type: TransactionType): string {
  return type === 'sent' ? '↗️' : '↘️';
}

/**
 * Print a single transaction
 */
function printTransaction(tx: Transaction): void {
  console.log(`
${getTypeIcon(tx.type)} ${tx.type.toUpperCase()} ${formatDate(tx.timestamp)}
ID: ${tx.id}
Amount: ${formatAmount(tx.amount)}${tx.fee > 0 ? ` (Fee: ${formatAmount(tx.fee)})` : ''}
Status: ${getStatusLabel(tx.status)}
Description: ${tx.description || 'No description'}
${tx.destination ? `Destination: ${tx.destination}` : ''}
`);
}

/**
 * Example 1: Fetch all transaction history
 */
async function fetchAllTransactions(): Promise<void> {
  try {
    console.log('\n🔍 FETCHING ALL TRANSACTIONS');
    console.log('============================');
    
    const history = await lndClient.listTransactionHistory();
    
    console.log(`Retrieved ${history.transactions.length} of ${history.total_count} transactions\n`);
    
    for (const tx of history.transactions) {
      printTransaction(tx);
    }
    
  } catch (error) {
    console.error('Error fetching all transactions:', error);
  }
}

/**
 * Example 2: Filter by transaction type
 */
async function filterByType(): Promise<void> {
  try {
    console.log('\n🔍 FILTERING BY TYPE - SENT TRANSACTIONS ONLY');
    console.log('============================================');
    
    const sentOnly = await lndClient.listTransactionHistory({
      types: ['sent']
    });
    
    console.log(`Retrieved ${sentOnly.transactions.length} sent transactions\n`);
    
    for (const tx of sentOnly.transactions) {
      printTransaction(tx);
    }
    
  } catch (error) {
    console.error('Error filtering by type:', error);
  }
}

/**
 * Example 3: Filter by status
 */
async function filterByStatus(): Promise<void> {
  try {
    console.log('\n🔍 FILTERING BY STATUS - SUCCESSFUL TRANSACTIONS ONLY');
    console.log('==================================================');
    
    const successfulOnly = await lndClient.listTransactionHistory({
      statuses: ['succeeded', 'settled']
    });
    
    console.log(`Retrieved ${successfulOnly.transactions.length} successful transactions\n`);
    
    for (const tx of successfulOnly.transactions) {
      printTransaction(tx);
    }
    
  } catch (error) {
    console.error('Error filtering by status:', error);
  }
}

/**
 * Example 4: Filter by date range
 */
async function filterByDateRange(): Promise<void> {
  try {
    // Last 24 hours
    const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
    
    console.log('\n🔍 FILTERING BY DATE - LAST 24 HOURS');
    console.log('===================================');
    
    const recentTxs = await lndClient.listTransactionHistory({
      creation_date_start: oneDayAgo.toString()
    });
    
    console.log(`Retrieved ${recentTxs.transactions.length} transactions from the last 24 hours\n`);
    
    for (const tx of recentTxs.transactions) {
      printTransaction(tx);
    }
    
  } catch (error) {
    console.error('Error filtering by date range:', error);
  }
}

/**
 * Example 5: Paginated results
 */
async function paginatedResults(): Promise<void> {
  try {
    console.log('\n🔍 PAGINATED RESULTS - PAGE 1 (2 ITEMS)');
    console.log('=====================================');
    
    // First page
    const page1 = await lndClient.listTransactionHistory({
      limit: 2,
      offset: 0
    });
    
    console.log(`Page 1: ${page1.transactions.length} items (Items 1-${page1.transactions.length} of ${page1.total_count})`);
    console.log(`Has more pages: ${page1.has_more ? 'Yes' : 'No'}\n`);
    
    for (const tx of page1.transactions) {
      printTransaction(tx);
    }
    
    if (page1.has_more) {
      console.log('\n🔍 PAGINATED RESULTS - PAGE 2 (2 ITEMS)');
      console.log('=====================================');
      
      // Second page
      const page2 = await lndClient.listTransactionHistory({
        limit: 2,
        offset: 2
      });
      
      console.log(`Page 2: ${page2.transactions.length} items (Items 3-${2 + page2.transactions.length} of ${page2.total_count})`);
      console.log(`Has more pages: ${page2.has_more ? 'Yes' : 'No'}\n`);
      
      for (const tx of page2.transactions) {
        printTransaction(tx);
      }
    }
    
  } catch (error) {
    console.error('Error with paginated results:', error);
  }
}

/**
 * Example 6: Combined filters
 */
async function combinedFilters(): Promise<void> {
  try {
    // Last 7 days
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    
    console.log('\n🔍 COMBINED FILTERS - SUCCESSFUL SENT PAYMENTS IN LAST 7 DAYS');
    console.log('========================================================');
    
    const filteredTxs = await lndClient.listTransactionHistory({
      types: ['sent'],
      statuses: ['succeeded'],
      creation_date_start: sevenDaysAgo.toString(),
      limit: 5
    });
    
    console.log(`Retrieved ${filteredTxs.transactions.length} successful sent payments from the last 7 days\n`);
    
    for (const tx of filteredTxs.transactions) {
      printTransaction(tx);
    }
    
  } catch (error) {
    console.error('Error with combined filters:', error);
  }
}

/**
 * Run all examples sequentially
 */
async function runExamples(): Promise<void> {
  try {
    console.log('🚀 TRANSACTION HISTORY EXAMPLES');
    console.log('==============================');
    
    await fetchAllTransactions();
    await filterByType();
    await filterByStatus();
    await filterByDateRange();
    await paginatedResults();
    await combinedFilters();
    
    console.log('\n✅ ALL EXAMPLES COMPLETED');
  } catch (error) {
    console.error('Error running examples:', error);
  } finally {
    process.exit(0);
  }
}

// Run the examples if this is the main file being executed
if (require.main === module) {
  runExamples();
}

// Export for use in the main examples file
export default runExamples; 