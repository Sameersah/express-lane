import type { MCPClient } from '../mcp/clients.js';
import { logger } from '../util/log.js';
import { getEnv } from '../util/env.js';
import type { Receipt } from './receipts.js';
import type { PaymentVerificationResult } from './payments.js';

export interface NotionPage {
  id: string;
  url: string;
}

/**
 * Create a Notion database entry for a payment receipt
 */
export async function createNotionPaymentEntry(
  notionClient: MCPClient,
  receipt: Receipt,
  verification: PaymentVerificationResult,
  jiraIssueKey?: string
): Promise<NotionPage> {
  const env = getEnv();
  const databaseId = env.NOTION_DB_ID;
  
  if (!databaseId) {
    throw new Error('NOTION_DB_ID not configured');
  }
  
  logger.info(`Creating Notion entry in database ${databaseId}`);
  
  try {
    const properties: Record<string, any> = {
      'Order ID': {
        title: [
          {
            text: {
              content: receipt.orderId,
            },
          },
        ],
      },
      'Amount': {
        number: receipt.amount,
      },
      'Currency': {
        select: {
          name: receipt.currency,
        },
      },
      'Payer': {
        rich_text: [
          {
            text: {
              content: receipt.payer,
            },
          },
        ],
      },
      'Status': {
        select: {
          name: verification.verified ? 'Verified' : 'Pending',
        },
      },
      'Source': {
        select: {
          name: receipt.source,
        },
      },
      'Timestamp': {
        date: {
          start: receipt.timestamp || new Date().toISOString(),
        },
      },
    };
    
    // Add Jira reference if available
    if (jiraIssueKey) {
      properties['Jira Issue'] = {
        rich_text: [
          {
            text: {
              content: jiraIssueKey,
            },
          },
        ],
      };
    }
    
    // Add transaction ID if available
    if (verification.transactionId) {
      properties['Transaction ID'] = {
        rich_text: [
          {
            text: {
              content: verification.transactionId,
            },
          },
        ],
      };
    }
    
    const result = await notionClient.callTool('pages.create', {
      parent: {
        database_id: databaseId,
      },
      properties,
    });
    
    // Parse the result
    let pageData: any;
    if (result.content && result.content[0]?.text) {
      pageData = JSON.parse(result.content[0].text);
    } else {
      pageData = result;
    }
    
    logger.success(`Created Notion page: ${pageData.id}`);
    
    return {
      id: pageData.id,
      url: pageData.url || `https://notion.so/${pageData.id.replace(/-/g, '')}`,
    };
    
  } catch (error: any) {
    logger.error(`Failed to create Notion entry: ${error.message}`);
    throw error;
  }
}

/**
 * Append a row to a Notion database (alternative approach)
 */
export async function appendNotionDatabaseRow(
  notionClient: MCPClient,
  receipt: Receipt,
  verification: PaymentVerificationResult,
  jiraIssueKey?: string
): Promise<NotionPage> {
  // This is an alias to createNotionPaymentEntry
  // Some MCP servers may use different tool names
  return createNotionPaymentEntry(notionClient, receipt, verification, jiraIssueKey);
}

/**
 * Mock Notion client for testing without credentials
 */
export function createMockNotionClient(): MCPClient {
  return {
    client: {} as any,
    name: 'notion-mock',
    
    async callTool(toolName: string, args: Record<string, unknown>) {
      logger.info(`[MOCK] Notion.${toolName} called`);
      
      if (toolName === 'pages.create' || toolName === 'appendDatabaseRow') {
        const pageId = `mock-page-${Date.now()}`;
        logger.success(`[MOCK] Created Notion page: ${pageId}`);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: pageId,
              url: `https://notion.so/${pageId}`,
              created_time: new Date().toISOString(),
            })
          }]
        };
      }
      
      return {};
    },
    
    async listTools() {
      return ['pages.create', 'pages.update', 'databases.query'];
    },
    
    async close() {
      logger.debug('[MOCK] Notion client closed');
    },
  };
}

