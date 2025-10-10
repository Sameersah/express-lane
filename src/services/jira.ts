import type { MCPClient } from '../mcp/clients.js';
import { logger } from '../util/log.js';
import { getEnv } from '../util/env.js';
import type { Receipt } from './receipts.js';
import type { PaymentVerificationResult } from './payments.js';

export interface JiraIssue {
  key: string;
  id: string;
  url: string;
}

/**
 * Create a Jira issue for a payment receipt
 */
export async function createPaymentJiraIssue(
  jiraClient: MCPClient,
  receipt: Receipt,
  verification: PaymentVerificationResult
): Promise<JiraIssue> {
  const env = getEnv();
  const projectKey = env.JIRA_PROJECT_KEY || 'EXP';
  
  const summary = `Payment Received: ${receipt.orderId} - $${receipt.amount.toFixed(2)}`;
  
  const description = [
    `*Payment Details*`,
    `* Order ID: ${receipt.orderId}`,
    `* Amount: $${receipt.amount.toFixed(2)} ${receipt.currency}`,
    `* Payer: ${receipt.payer}`,
    `* Source: ${receipt.source}`,
    receipt.timestamp ? `* Timestamp: ${new Date(receipt.timestamp).toLocaleString()}` : '',
    ``,
    `*Verification Status*`,
    `* Verified: ${verification.verified ? '✓ Yes' : '✗ No'}`,
    `* Status: ${verification.status.toUpperCase()}`,
    verification.transactionId ? `* Transaction ID: ${verification.transactionId}` : '',
    verification.message ? `* Message: ${verification.message}` : '',
    `* Verified At: ${new Date(verification.verifiedAt).toLocaleString()}`,
    ``,
    receipt.description ? `*Original Message*\n${receipt.description}` : '',
    ``,
    `_Automatically created by Expense Fast Lane_`,
  ].filter(Boolean).join('\n');
  
  logger.info(`Creating Jira issue in project ${projectKey}`);
  
  try {
    const result = await jiraClient.callTool('createIssue', {
      fields: {
        project: {
          key: projectKey,
        },
        summary,
        description,
        issuetype: {
          name: 'Task',
        },
        labels: ['payment', 'expense', 'automated'],
        priority: {
          name: verification.verified ? 'Medium' : 'High',
        },
      },
    });
    
    // Parse the result
    let issueData: any;
    if (result.content && result.content[0]?.text) {
      issueData = JSON.parse(result.content[0].text);
    } else {
      issueData = result;
    }
    
    const jiraBaseUrl = env.JIRA_BASE_URL || 'https://your-domain.atlassian.net';
    const issueUrl = `${jiraBaseUrl}/browse/${issueData.key}`;
    
    logger.success(`Created Jira issue: ${issueData.key}`);
    
    return {
      key: issueData.key,
      id: issueData.id,
      url: issueUrl,
    };
    
  } catch (error: any) {
    logger.error(`Failed to create Jira issue: ${error.message}`);
    throw error;
  }
}

/**
 * Mock Jira client for testing without credentials
 */
export function createMockJiraClient(): MCPClient {
  let issueCounter = 1000;
  
  return {
    client: {} as any,
    name: 'jira-mock',
    
    async callTool(toolName: string, args: Record<string, unknown>) {
      logger.info(`[MOCK] Jira.${toolName} called`);
      
      if (toolName === 'createIssue') {
        const issueKey = `EXP-${issueCounter++}`;
        logger.success(`[MOCK] Created Jira issue: ${issueKey}`);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              key: issueKey,
              id: `${issueCounter}`,
              self: `https://your-domain.atlassian.net/rest/api/2/issue/${issueCounter}`,
            })
          }]
        };
      }
      
      return {};
    },
    
    async listTools() {
      return ['createIssue', 'getIssue', 'updateIssue'];
    },
    
    async close() {
      logger.debug('[MOCK] Jira client closed');
    },
  };
}

