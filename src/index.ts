#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { loadEnv, getEnv } from './util/env.js';
import { logger } from './util/log.js';
import { initializeMCPClients, closeMCPClients } from './mcp/clients.js';
import { orchestrateExpenseFastLane } from './orchestrator.js';
import type { Receipt } from './services/receipts.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface CLIArgs {
  sourceSlackChannel?: string;
  mockReceiptFile?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

async function main() {
  // Parse command-line arguments
  const argv = await yargs(hideBin(process.argv))
    .option('sourceSlackChannel', {
      alias: 's',
      type: 'string',
      description: 'Slack channel ID to read payment messages from',
    })
    .option('mockReceiptFile', {
      alias: 'm',
      type: 'string',
      description: 'Path to mock receipt JSON file',
    })
    .option('dryRun', {
      alias: 'd',
      type: 'boolean',
      default: false,
      description: 'Dry run mode (skip Jira/Notion/Slack updates)',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      description: 'Enable verbose logging',
    })
    .help()
    .alias('help', 'h')
    .example('$0', 'Run with environment variables')
    .example('$0 --sourceSlackChannel C01234567', 'Read from specific Slack channel')
    .example('$0 --mockReceiptFile ./receipt.json --dryRun', 'Test with mock receipt')
    .parse() as CLIArgs;

  // Load environment variables
  try {
    loadEnv();
  } catch (error: any) {
    logger.error(`Failed to load environment: ${error.message}`);
    logger.info('Please copy env.example to .env and configure your credentials');
    process.exit(1);
  }

  const env = getEnv();

  logger.section('💸 Expense → Revenue Fast Lane MVP');
  logger.info('Using CodeGlide MCP Servers');
  logger.info(`Mock Mode: ${env.MOCK_MODE ? '🎭 Enabled' : '🔒 Disabled'}`);
  
  if (argv.dryRun) {
    logger.info('🎭 Dry Run Mode: Enabled');
  }

  let clients = {};
  
  try {
    // Load mock receipt if provided
    let mockReceipt: Receipt | undefined;
    if (argv.mockReceiptFile) {
      const filePath = resolve(process.cwd(), argv.mockReceiptFile);
      logger.info(`Loading mock receipt from: ${filePath}`);
      const fileContent = readFileSync(filePath, 'utf-8');
      mockReceipt = JSON.parse(fileContent);
      logger.success('Mock receipt loaded');
    }

    // Initialize MCP clients
    if (!env.MOCK_MODE && !mockReceipt) {
      clients = await initializeMCPClients();
      
      // Check if any clients were successfully initialized
      if (Object.keys(clients).length === 0) {
        logger.warn('No MCP clients initialized. Please check your configuration.');
        logger.info('Running in mock mode instead...');
      }
    } else {
      logger.info('Skipping MCP client initialization (mock mode or mock receipt provided)');
    }

    // Run orchestration
    const result = await orchestrateExpenseFastLane(clients, {
      sourceSlackChannel: argv.sourceSlackChannel,
      mockReceipt,
      dryRun: argv.dryRun,
    });

    // Display results
    if (result.success) {
      logger.success('🎉 All steps completed successfully!');
      process.exit(0);
    } else {
      logger.warn('⚠️ Completed with some errors');
      process.exit(1);
    }
    
  } catch (error: any) {
    logger.error(`Fatal error: ${error.message}`);
    if (argv.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
    
  } finally {
    // Cleanup
    if (Object.keys(clients).length > 0) {
      await closeMCPClients(clients);
    }
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  logger.error(`Main function error: ${error.message}`);
  process.exit(1);
});

