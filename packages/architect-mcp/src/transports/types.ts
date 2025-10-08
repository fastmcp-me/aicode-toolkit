import type { Request, Response } from 'express';

/**
 * Transport mode types
 */
export enum TransportMode {
  STDIO = 'stdio',
  HTTP = 'http',
  SSE = 'sse',
  CLI = 'cli',
}

/**
 * Transport configuration options
 */
export interface TransportConfig {
  mode: TransportMode;
  port?: number;
  host?: string;
}

/**
 * Base interface for all transport handlers
 */
export interface TransportHandler {
  start(): Promise<void>;
  stop(): Promise<void>;
}

/**
 * HTTP transport specific types
 */
export interface HttpTransportHandler extends TransportHandler {
  getPort(): number;
  getHost(): string;
}

/**
 * Session management interface for HTTP/SSE transports
 */
export interface SessionManager {
  getSession(sessionId: string): any;
  setSession(sessionId: string, transport: any, ...args: any[]): void;
  deleteSession(sessionId: string): void;
  hasSession(sessionId: string): boolean;
}

/**
 * Express request handler type
 */
export type ExpressRequestHandler = (req: Request, res: Response) => Promise<void>;
