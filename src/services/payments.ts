import { logger } from '../util/log.js';
import { getEnv } from '../util/env.js';
import type { Receipt } from './receipts.js';
import fetch from 'node-fetch';

export interface PaymentVerificationResult {
  verified: boolean;
  orderId: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  transactionId?: string;
  message?: string;
  verifiedAt: string;
}

/**
 * Verify payment via Square API or mock
 */
export async function verifyPayment(receipt: Receipt): Promise<PaymentVerificationResult> {
  const env = getEnv();
  
  if (env.MOCK_MODE) {
    return mockVerifyPayment(receipt);
  }
  
  return squareVerifyPayment(receipt);
}

/**
 * Mock payment verification (for demo/testing)
 */
async function mockVerifyPayment(receipt: Receipt): Promise<PaymentVerificationResult> {
  logger.info('🎭 Mock payment verification mode');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock verification logic: succeed for amounts > 0
  const verified = receipt.amount > 0;
  
  return {
    verified,
    orderId: receipt.orderId,
    amount: receipt.amount,
    status: verified ? 'success' : 'failed',
    transactionId: `mock_txn_${Date.now()}`,
    message: verified 
      ? `Mock verification successful for $${receipt.amount}`
      : 'Mock verification failed',
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Verify payment via Square API
 */
async function squareVerifyPayment(receipt: Receipt): Promise<PaymentVerificationResult> {
  const env = getEnv();
  
  if (!env.SQUARE_ACCESS_TOKEN) {
    throw new Error('SQUARE_ACCESS_TOKEN not configured');
  }
  
  logger.info(`Verifying payment via Square API for order ${receipt.orderId}`);
  
  try {
    // Search for payment by order ID
    const response = await fetch('https://connect.squareup.com/v2/payments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Square API error: ${response.statusText}`);
    }
    
    const data: any = await response.json();
    
    // Find matching payment
    const payment = data.payments?.find((p: any) => 
      p.reference_id === receipt.orderId || 
      p.order_id === receipt.orderId
    );
    
    if (!payment) {
      return {
        verified: false,
        orderId: receipt.orderId,
        amount: receipt.amount,
        status: 'failed',
        message: 'Payment not found in Square',
        verifiedAt: new Date().toISOString(),
      };
    }
    
    // Check payment status and amount
    const verified = payment.status === 'COMPLETED' && 
                     payment.amount_money.amount === receipt.amount * 100; // Square uses cents
    
    return {
      verified,
      orderId: receipt.orderId,
      amount: receipt.amount,
      status: verified ? 'success' : 'pending',
      transactionId: payment.id,
      message: verified ? 'Payment verified' : 'Payment status mismatch',
      verifiedAt: new Date().toISOString(),
    };
    
  } catch (error: any) {
    logger.error(`Square payment verification failed: ${error.message}`);
    
    return {
      verified: false,
      orderId: receipt.orderId,
      amount: receipt.amount,
      status: 'failed',
      message: error.message,
      verifiedAt: new Date().toISOString(),
    };
  }
}

/**
 * Format verification result for display
 */
export function formatVerificationResult(result: PaymentVerificationResult): string {
  const emoji = result.verified ? '✅' : '❌';
  
  return [
    `${emoji} Payment Verification`,
    `Order: ${result.orderId}`,
    `Amount: $${result.amount.toFixed(2)}`,
    `Status: ${result.status.toUpperCase()}`,
    result.transactionId ? `Transaction: ${result.transactionId}` : '',
    result.message ? `Message: ${result.message}` : '',
    `Verified at: ${new Date(result.verifiedAt).toLocaleString()}`,
  ].filter(Boolean).join('\n');
}

