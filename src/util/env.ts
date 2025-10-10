import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Slack
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_CHANNEL_ID: z.string().optional(),
  
  // Notion
  NOTION_TOKEN: z.string().optional(),
  NOTION_DB_ID: z.string().optional(),
  
  // Jira
  JIRA_BASE_URL: z.string().optional(),
  JIRA_EMAIL: z.string().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  JIRA_PROJECT_KEY: z.string().default('EXP'),
  
  // Payment
  SQUARE_ACCESS_TOKEN: z.string().optional(),
  MOCK_MODE: z.string().default('true').transform(v => v === 'true'),
  
  // MCP Paths
  MCP_SLACK_PATH: z.string().default('./mcp-servers/slack_web'),
  MCP_NOTION_PATH: z.string().default('./mcp-servers/Notion'),
  MCP_JIRA_PATH: z.string().default('./mcp-servers/Jira_Integration_API'),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function loadEnv(): Env {
  if (_env) return _env;
  
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Environment validation failed');
  }
  
  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    throw new Error('Environment not loaded. Call loadEnv() first.');
  }
  return _env;
}

export function isMockMode(): boolean {
  return getEnv().MOCK_MODE;
}

