import { z } from 'zod';

export const ReceiptSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  payer: z.string(),
  description: z.string().optional(),
  timestamp: z.string().optional(),
  source: z.enum(['slack', 'email', 'webhook', 'manual']).default('slack'),
});

export type Receipt = z.infer<typeof ReceiptSchema>;

/**
 * Parse a Slack message to extract payment receipt information
 */
export function parseReceiptFromSlackMessage(messageText: string): Receipt | null {
  // Example patterns to match:
  // "Payment received: $150 from John Doe for Order #12345"
  // "Received $99.99 from jane@example.com, order ABC-123"
  // "$50 payment from Alice, order #789"
  
  const patterns = [
    /(?:payment|received|paid).*?\$(\d+(?:\.\d{2})?)\s+(?:from|by)\s+([^\s,]+(?:\s+[^\s,]+)?)[,\s]+.*?(?:order|#)\s*([A-Za-z0-9-]+)/i,
    /\$(\d+(?:\.\d{2})?)\s+(?:from|by)\s+([^\s,]+(?:\s+[^\s,]+)?)[,\s]+.*?(?:order|#)\s*([A-Za-z0-9-]+)/i,
    /(?:order|#)\s*([A-Za-z0-9-]+)[,\s]+.*?\$(\d+(?:\.\d{2})?)\s+(?:from|by)\s+([^\s,]+(?:\s+[^\s,]+)?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = messageText.match(pattern);
    if (match) {
      // Handle different capture group orders
      let amount: string, payer: string, orderId: string;
      
      if (match[0].startsWith('$') || match[0].toLowerCase().includes('payment')) {
        [, amount, payer, orderId] = match;
      } else {
        [, orderId, amount, payer] = match;
      }
      
      const receipt: Receipt = {
        orderId: orderId.trim(),
        amount: parseFloat(amount),
        currency: 'USD',
        payer: payer.trim(),
        description: messageText.substring(0, 200),
        timestamp: new Date().toISOString(),
        source: 'slack',
      };
      
      const validation = ReceiptSchema.safeParse(receipt);
      if (validation.success) {
        return validation.data;
      }
    }
  }
  
  return null;
}

/**
 * Format receipt for display
 */
export function formatReceipt(receipt: Receipt): string {
  return [
    `Order ID: ${receipt.orderId}`,
    `Amount: $${receipt.amount.toFixed(2)} ${receipt.currency}`,
    `Payer: ${receipt.payer}`,
    `Source: ${receipt.source}`,
    receipt.timestamp ? `Time: ${new Date(receipt.timestamp).toLocaleString()}` : '',
    receipt.description ? `Description: ${receipt.description}` : '',
  ].filter(Boolean).join('\n');
}

/**
 * Validate receipt data
 */
export function validateReceipt(data: unknown): Receipt {
  return ReceiptSchema.parse(data);
}

