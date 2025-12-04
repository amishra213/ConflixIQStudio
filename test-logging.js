/**
 * Test script to verify logging framework functionality
 * Run with: node test-logging.js [DEBUG|INFO|WARN|ERROR]
 */

import { serverLogger } from './server-logger.js';

// Set log level from command line argument or default to DEBUG
const logLevel = process.argv[2] || 'DEBUG';
serverLogger.setLevel(logLevel);

console.log('\n=== Logging Framework Test ===\n');
console.log(`📋 Log Level Set to: ${logLevel}`);
console.log(`📊 Logger Configuration:`, serverLogger.getStats());
console.log('\n--- Testing All Log Levels ---\n');

// Test all log levels
serverLogger.debug('🔵 This is a DEBUG message - routine operational details');
serverLogger.info('🟢 This is an INFO message - significant events');
serverLogger.warn('🟡 This is a WARN message - warning conditions');
serverLogger.error('🔴 This is an ERROR message - error conditions');

console.log('\n--- Testing with Objects ---\n');

// Test logging with objects
serverLogger.debug('Debug with object:', {
  userId: 123,
  action: 'login',
  timestamp: new Date().toISOString(),
});

serverLogger.info('Info with array:', ['item1', 'item2', 'item3']);

serverLogger.warn('Warning with nested data:', {
  component: 'FileStore',
  issue: 'Cache size approaching limit',
  currentSize: '45MB',
  maxSize: '50MB',
});

serverLogger.error('Error with stack:', new Error('Test error message'));

console.log('\n--- Testing Filtering ---\n');

// Change log level and test filtering
console.log('📋 Changing to WARN level...\n');
serverLogger.setLevel('WARN');

serverLogger.debug('This DEBUG should NOT appear ❌');
serverLogger.info('This INFO should NOT appear ❌');
serverLogger.warn('🟡 This WARN should appear ✓');
serverLogger.error('🔴 This ERROR should appear ✓');

console.log('\n--- Test Complete ---\n');
console.log('✅ Check logs/ folder for file output');
console.log('📁 Log files are stored with daily rotation (logs/conflixiq-YYYY-MM-DD.log)');
console.log('\n');

// Give async file writing time to complete
await new Promise(resolve => setTimeout(resolve, 100));
