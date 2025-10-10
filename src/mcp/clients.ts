import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { logger } from '../util/log.js';
import { getEnv } from '../util/env.js';

export interface MCPClient {
  client: Client;
  name: string;
  callTool(toolName: string, args: Record<string, unknown>): Promise<any>;
  listTools(): Promise<string[]>;
  close(): Promise<void>;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export async function createMCPClient(config: MCPServerConfig): Promise<MCPClient> {
  const { name, command, args, env } = config;
  
  logger.debug(`Initializing MCP client: ${name}`);
  
  const client = new Client({
    name: `expense-lane-${name}`,
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  });
  
  // Spawn the MCP server process
  const serverProcess = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  
  // Handle server errors
  serverProcess.stderr?.on('data', (data) => {
    logger.debug(`[${name}] ${data.toString()}`);
  });
  
  serverProcess.on('error', (error) => {
    logger.error(`MCP server ${name} process error: ${error.message}`);
  });
  
  // Create transport
  const transport = new StdioClientTransport({
    reader: serverProcess.stdout!,
    writer: serverProcess.stdin!,
  });
  
  // Connect client
  await client.connect(transport);
  
  logger.success(`Connected to MCP server: ${name}`);
  
  return {
    client,
    name,
    
    async callTool(toolName: string, args: Record<string, unknown>) {
      try {
        logger.debug(`Calling ${name}.${toolName} with args:`, { timestamp: false });
        logger.debug(JSON.stringify(args, null, 2), { timestamp: false });
        
        const result = await client.callTool({
          name: toolName,
          arguments: args,
        });
        
        logger.debug(`${name}.${toolName} response:`, { timestamp: false });
        logger.debug(JSON.stringify(result, null, 2), { timestamp: false });
        
        return result;
      } catch (error: any) {
        logger.error(`Failed to call ${name}.${toolName}: ${error.message}`);
        throw error;
      }
    },
    
    async listTools() {
      const response = await client.listTools();
      return response.tools.map((tool: any) => tool.name);
    },
    
    async close() {
      await client.close();
      serverProcess.kill();
      logger.debug(`Closed MCP client: ${name}`);
    },
  };
}

export interface MCPClients {
  slack?: MCPClient;
  notion?: MCPClient;
  jira?: MCPClient;
}

export async function initializeMCPClients(): Promise<MCPClients> {
  const env = getEnv();
  const clients: MCPClients = {};
  
  logger.section('Initializing MCP Clients');
  
  // Initialize Slack MCP client
  if (env.SLACK_BOT_TOKEN) {
    try {
      clients.slack = await createMCPClient({
        name: 'slack',
        command: 'node',
        args: [`${env.MCP_SLACK_PATH}/bin/slack-mcp.js`],
        env: {
          SLACK_BOT_TOKEN: env.SLACK_BOT_TOKEN,
        },
      });
    } catch (error: any) {
      logger.warn(`Failed to initialize Slack MCP: ${error.message}`);
    }
  } else {
    logger.warn('Slack MCP skipped (no SLACK_BOT_TOKEN)');
  }
  
  // Initialize Notion MCP client
  if (env.NOTION_TOKEN) {
    try {
      clients.notion = await createMCPClient({
        name: 'notion',
        command: 'node',
        args: [`${env.MCP_NOTION_PATH}/bin/notion-mcp.js`],
        env: {
          NOTION_TOKEN: env.NOTION_TOKEN,
        },
      });
    } catch (error: any) {
      logger.warn(`Failed to initialize Notion MCP: ${error.message}`);
    }
  } else {
    logger.warn('Notion MCP skipped (no NOTION_TOKEN)');
  }
  
  // Initialize Jira MCP client
  if (env.JIRA_BASE_URL && env.JIRA_EMAIL && env.JIRA_API_TOKEN) {
    try {
      clients.jira = await createMCPClient({
        name: 'jira',
        command: 'node',
        args: [`${env.MCP_JIRA_PATH}/bin/jira-mcp.js`],
        env: {
          JIRA_BASE_URL: env.JIRA_BASE_URL,
          JIRA_EMAIL: env.JIRA_EMAIL,
          JIRA_API_TOKEN: env.JIRA_API_TOKEN,
        },
      });
    } catch (error: any) {
      logger.warn(`Failed to initialize Jira MCP: ${error.message}`);
    }
  } else {
    logger.warn('Jira MCP skipped (missing credentials)');
  }
  
  const connectedCount = Object.keys(clients).length;
  logger.success(`Initialized ${connectedCount} MCP client(s)`);
  
  return clients;
}

export async function closeMCPClients(clients: MCPClients): Promise<void> {
  logger.info('Closing MCP clients...');
  
  const closePromises = Object.values(clients)
    .filter((client): client is MCPClient => client !== undefined)
    .map(client => client.close());
  
  await Promise.all(closePromises);
  
  logger.success('All MCP clients closed');
}

