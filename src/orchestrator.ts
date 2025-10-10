import type { MCPClients } from './mcp/clients.js';
import { logger } from './util/log.js';
import { getEnv } from './util/env.js';
import type { Receipt } from './services/receipts.js';
import { formatReceipt } from './services/receipts.js';
import { verifyPayment, formatVerificationResult, type PaymentVerificationResult } from './services/payments.js';
import { findPaymentReceipt, postConfirmationMessage, createMockSlackClient } from './services/slack.js';
import { createPaymentJiraIssue, createMockJiraClient, type JiraIssue } from './services/jira.js';
import { createNotionPaymentEntry, createMockNotionClient, type NotionPage } from './services/notion.js';

export interface OrchestrationResult {
  receipt: Receipt;
  verification: PaymentVerificationResult;
  jiraIssue?: JiraIssue;
  notionPage?: NotionPage;
  success: boolean;
  errors: string[];
}

export interface OrchestrationOptions {
  sourceSlackChannel?: string;
  mockReceipt?: Receipt;
  dryRun?: boolean;
}

/**
 * Main orchestration function: Slack → Payment → Jira → Notion → Slack
 */
export async function orchestrateExpenseFastLane(
  clients: MCPClients,
  options: OrchestrationOptions = {}
): Promise<OrchestrationResult> {
  const env = getEnv();
  const errors: string[] = [];
  let receipt: Receipt | null = null;
  let verification: PaymentVerificationResult | null = null;
  let jiraIssue: JiraIssue | undefined;
  let notionPage: NotionPage | undefined;
  let originalMessageTs: string | undefined;
  
  logger.section('🚀 Expense Fast Lane Orchestration');
  
  try {
    // ============================================================
    // STEP 1: Read payment message from Slack
    // ============================================================
    logger.step(1, 'Reading payment message from Slack');
    
    if (options.mockReceipt) {
      logger.info('Using provided mock receipt');
      receipt = options.mockReceipt;
    } else {
      const slackClient = clients.slack || createMockSlackClient();
      const channelId = options.sourceSlackChannel || env.SLACK_CHANNEL_ID;
      
      if (!channelId) {
        throw new Error('No Slack channel ID provided');
      }
      
      const found = await findPaymentReceipt(slackClient, channelId);
      
      if (!found) {
        throw new Error('No payment receipt found in Slack messages');
      }
      
      receipt = found.receipt;
      originalMessageTs = found.message.ts;
    }
    
    logger.success('Receipt extracted:');
    console.log(formatReceipt(receipt));
    
    // ============================================================
    // STEP 2: Verify payment
    // ============================================================
    logger.step(2, 'Verifying payment');
    
    verification = await verifyPayment(receipt);
    
    logger.success('Payment verification complete:');
    console.log(formatVerificationResult(verification));
    
    if (!verification.verified) {
      logger.warn('Payment verification failed, but continuing with flow...');
    }
    
    if (options.dryRun) {
      logger.info('🎭 Dry run mode - skipping Jira, Notion, and Slack updates');
      return {
        receipt,
        verification,
        success: true,
        errors,
      };
    }
    
    // ============================================================
    // STEP 3: Create Jira task
    // ============================================================
    logger.step(3, 'Creating Jira task');
    
    try {
      const jiraClient = clients.jira || createMockJiraClient();
      jiraIssue = await createPaymentJiraIssue(jiraClient, receipt, verification);
      logger.success(`Jira issue created: ${jiraIssue.key} (${jiraIssue.url})`);
    } catch (error: any) {
      logger.error(`Jira creation failed: ${error.message}`);
      errors.push(`Jira: ${error.message}`);
    }
    
    // ============================================================
    // STEP 4: Append to Notion database
    // ============================================================
    logger.step(4, 'Appending to Notion database');
    
    try {
      const notionClient = clients.notion || createMockNotionClient();
      notionPage = await createNotionPaymentEntry(
        notionClient,
        receipt,
        verification,
        jiraIssue?.key
      );
      logger.success(`Notion page created: ${notionPage.id} (${notionPage.url})`);
    } catch (error: any) {
      logger.error(`Notion creation failed: ${error.message}`);
      errors.push(`Notion: ${error.message}`);
    }
    
    // ============================================================
    // STEP 5: Post confirmation to Slack
    // ============================================================
    logger.step(5, 'Posting confirmation to Slack');
    
    try {
      const slackClient = clients.slack || createMockSlackClient();
      const channelId = options.sourceSlackChannel || env.SLACK_CHANNEL_ID;
      
      if (channelId && jiraIssue) {
        await postConfirmationMessage(
          slackClient,
          channelId,
          receipt,
          jiraIssue.key,
          notionPage?.url,
          originalMessageTs
        );
        logger.success('Confirmation message posted to Slack');
      } else {
        logger.warn('Skipped Slack confirmation (missing channel or Jira issue)');
      }
    } catch (error: any) {
      logger.error(`Slack confirmation failed: ${error.message}`);
      errors.push(`Slack: ${error.message}`);
    }
    
    // ============================================================
    // Summary
    // ============================================================
    logger.section('✅ Orchestration Complete');
    
    const summary = [
      `🧾 Receipt: ${receipt.orderId} - $${receipt.amount.toFixed(2)}`,
      `💳 Verification: ${verification.verified ? '✓ Verified' : '✗ Failed'}`,
      jiraIssue ? `📋 Jira: ${jiraIssue.key}` : '📋 Jira: ✗ Failed',
      notionPage ? `📘 Notion: ${notionPage.id}` : '📘 Notion: ✗ Failed',
      `🔔 Slack: ${errors.some(e => e.includes('Slack')) ? '✗ Failed' : '✓ Posted'}`,
    ];
    
    console.log('\n' + summary.join('\n') + '\n');
    
    if (errors.length > 0) {
      logger.warn(`Completed with ${errors.length} error(s):`);
      errors.forEach(err => logger.error(`  - ${err}`));
    }
    
    return {
      receipt,
      verification,
      jiraIssue,
      notionPage,
      success: errors.length === 0,
      errors,
    };
    
  } catch (error: any) {
    logger.error(`Orchestration failed: ${error.message}`);
    
    return {
      receipt: receipt!,
      verification: verification!,
      success: false,
      errors: [...errors, error.message],
    };
  }
}

