#!/usr/bin/env node
import('./index.js').catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
