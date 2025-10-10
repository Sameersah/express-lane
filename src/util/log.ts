type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

interface LogOptions {
  timestamp?: boolean;
  prefix?: string;
}

const colors = {
  info: '\x1b[36m',    // Cyan
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  success: '\x1b[32m', // Green
  debug: '\x1b[90m',   // Gray
  reset: '\x1b[0m',
};

const icons = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  success: '✅',
  debug: '🔍',
};

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

function log(level: LogLevel, message: string, options: LogOptions = {}): void {
  const { timestamp = true, prefix = '' } = options;
  
  const parts: string[] = [];
  
  if (timestamp) {
    parts.push(`[${formatTimestamp()}]`);
  }
  
  parts.push(icons[level]);
  
  if (prefix) {
    parts.push(`[${prefix}]`);
  }
  
  parts.push(message);
  
  const colorCode = colors[level];
  const resetCode = colors.reset;
  
  const output = `${colorCode}${parts.join(' ')}${resetCode}`;
  
  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (message: string, options?: LogOptions) => log('info', message, options),
  warn: (message: string, options?: LogOptions) => log('warn', message, options),
  error: (message: string, options?: LogOptions) => log('error', message, options),
  success: (message: string, options?: LogOptions) => log('success', message, options),
  debug: (message: string, options?: LogOptions) => log('debug', message, options),
  
  section: (title: string) => {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${title}`);
    console.log('='.repeat(60) + '\n');
  },
  
  step: (stepNum: number, message: string) => {
    log('info', `Step ${stepNum}: ${message}`, { timestamp: false });
  },
};

export default logger;

