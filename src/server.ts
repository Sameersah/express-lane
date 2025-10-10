import express from 'express';
import cors from 'cors';
import { orchestrateExpenseFastLane } from './orchestrator.js';
import { validateReceipt, type Receipt } from './services/receipts.js';
import { loadEnv } from './util/env.js';
import { logger } from './util/log.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
loadEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Expense Fast Lane' });
});

// Process payment endpoint
app.post('/api/process-payment', async (req, res) => {
  try {
    const receipt: Receipt = validateReceipt(req.body);
    
    logger.info(`Processing payment: ${receipt.orderId}`);
    
    // Run orchestration
    const result = await orchestrateExpenseFastLane({}, {
      mockReceipt: receipt,
      dryRun: false,
    });
    
    res.json({
      success: result.success,
      receipt: result.receipt,
      verification: result.verification,
      jiraIssue: result.jiraIssue,
      notionPage: result.notionPage,
      errors: result.errors,
    });
  } catch (error: any) {
    logger.error(`API error: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get sample receipts
app.get('/api/samples', (req, res) => {
  const samples = [
    {
      id: 'sample1',
      name: 'Office Supplies',
      orderId: 'ORD-2024-001',
      amount: 150.00,
      currency: 'USD',
      payer: 'John Doe',
      description: 'Payment received: $150.00 from John Doe for order #ORD-2024-001 - Office supplies purchase',
      timestamp: new Date().toISOString(),
      source: 'slack' as const,
    },
    {
      id: 'sample2',
      name: 'Software Subscription',
      orderId: 'ORD-2024-002',
      amount: 99.99,
      currency: 'USD',
      payer: 'Jane Smith',
      description: 'Received $99.99 from Jane Smith, order ORD-2024-002 - Software subscription renewal',
      timestamp: new Date().toISOString(),
      source: 'slack' as const,
    },
    {
      id: 'sample3',
      name: 'Marketing Campaign',
      orderId: 'ORD-2024-003',
      amount: 275.50,
      currency: 'USD',
      payer: 'Alice Johnson',
      description: '$275.50 payment from Alice Johnson for order #ORD-2024-003 - Marketing campaign expenses',
      timestamp: new Date().toISOString(),
      source: 'slack' as const,
    },
  ];
  
  res.json(samples);
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     💸 Expense Fast Lane Web UI                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server running at: http://localhost:${PORT}`);
  console.log(`✅ API endpoint: http://localhost:${PORT}/api/process-payment`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

