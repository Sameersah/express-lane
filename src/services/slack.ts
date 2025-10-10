import type { MCPClient } from '../mcp/clients.js';
import { logger } from '../util/log.js';
import { parseReceiptFromSlackMessage, type Receipt } from './receipts.js';

export interface SlackMessage {
  type: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
}

export interface SlackChannel {
  id: string;
  name?: string;
}

/**
 * Fetch latest messages from a Slack channel
 */
export async function fetchLatestSlackMessages(
  slackClient: MCPClient,
  channelId: string,
  limit: number = 10
): Promise<SlackMessage[]> {
  logger.info(`Fetching latest ${limit} messages from Slack channel ${channelId}`);
  
  try {
    const result = await slackClient.callTool('conversations.history', {
      channel: channelId,
      limit,
    });
    
    if (result.content && result.content[0]?.text) {
      const data = JSON.parse(result.content[0].text);
      return data.messages || [];
    }
    
    return [];
  } catch (error: any) {
    logger.error(`Failed to fetch Slack messages: ${error.message}`);
    throw error;
  }
}

/**
 * Find payment receipt in recent Slack messages
 */
export async function findPaymentReceipt(
  slackClient: MCPClient,
  channelId: string
): Promise<{ receipt: Receipt; message: SlackMessage } | null> {
  const messages = await fetchLatestSlackMessages(slackClient, channelId, 20);
  
  for (const message of messages) {
    if (!message.text) continue;
    
    const receipt = parseReceiptFromSlackMessage(message.text);
    if (receipt) {
      logger.success(`Found payment receipt in message: ${message.text.substring(0, 50)}...`);
      return { receipt, message };
    }
  }
  
  logger.warn('No payment receipt found in recent messages');
  return null;
}

/**
 * Post a message to Slack channel
 */
export async function postSlackMessage(
  slackClient: MCPClient,
  channelId: string,
  text: string,
  threadTs?: string
): Promise<void> {
  logger.info(`Posting message to Slack channel ${channelId}`);
  
  try {
    await slackClient.callTool('chat.postMessage', {
      channel: channelId,
      text,
      thread_ts: threadTs,
    });
    
    logger.success('Message posted to Slack');
  } catch (error: any) {
    logger.error(`Failed to post Slack message: ${error.message}`);
    throw error;
  }
}

/**
 * Post a confirmation message to Slack
 */
export async function postConfirmationMessage(
  slackClient: MCPClient,
  channelId: string,
  receipt: Receipt,
  jiraIssueKey: string,
  notionPageUrl?: string,
  threadTs?: string
): Promise<void> {
  const message = [
    `✅ *Payment Processed Successfully*`,
    ``,
    `🧾 Order: \`${receipt.orderId}\``,
    `💰 Amount: $${receipt.amount.toFixed(2)} ${receipt.currency}`,
    `👤 Payer: ${receipt.payer}`,
    ``,
    `📋 Jira Task: ${jiraIssueKey}`,
    notionPageUrl ? `📘 Notion Entry: ${notionPageUrl}` : '',
    ``,
    `_Automated via Expense Fast Lane 🚀_`,
  ].filter(Boolean).join('\n');
  
  await postSlackMessage(slackClient, channelId, message, threadTs);
}

/**
 * Mock Slack client for testing without credentials
 */
export function createMockSlackClient(): MCPClient {
  return {
    client: {} as any,
    name: 'slack-mock',
    
    async callTool(toolName: string, args: Record<string, unknown>) {
      logger.info(`[MOCK] Slack.${toolName} called`);
      
      if (toolName === 'conversations.history') {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              messages: [
                {
                  type: 'message',
                  user: 'U123456',
                  text: 'Payment received: $150.00 from John Doe for order #ORD-2024-001',
                  ts: '1234567890.123456',
                }
              ]
            })
          }]
        };
      }
      
      if (toolName === 'chat.postMessage') {
        logger.success(`[MOCK] Message posted: ${(args.text as string).substring(0, 50)}...`);
        return { ok: true };
      }
      
      return {};
    },
    
    async listTools() {
      return ['conversations.history', 'chat.postMessage'];
    },
    
    async close() {
      logger.debug('[MOCK] Slack client closed');
    },
  };
}

