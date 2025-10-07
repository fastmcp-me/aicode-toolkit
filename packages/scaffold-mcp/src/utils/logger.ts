import * as os from 'node:os';
import * as path from 'node:path';
import pino from 'pino';

// Create logs directory path in OS temp directory
const logsDir = path.join(os.tmpdir(), 'scaffold-mcp-logs');

// Create a pino logger that writes to file
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination({
    dest: path.join(logsDir, 'scaffold-mcp.log'),
    mkdir: true,
    sync: false,
  }),
);

// Export convenience methods
export const log = {
  debug: (msg: string, ...args: any[]) => logger.debug({ args }, msg),
  info: (msg: string, ...args: any[]) => logger.info({ args }, msg),
  warn: (msg: string, ...args: any[]) => logger.warn({ args }, msg),
  error: (msg: string, ...args: any[]) => logger.error({ args }, msg),
};
