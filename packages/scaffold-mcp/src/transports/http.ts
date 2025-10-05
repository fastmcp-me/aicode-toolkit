import { randomUUID } from 'node:crypto';
import type { Server as HttpServer } from 'node:http';
import type { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express, { type Request, type Response } from 'express';
import type {
  HttpTransportHandler as IHttpTransportHandler,
  SessionManager,
  TransportConfig,
} from './types.js';

/**
 * Session manager for HTTP transports
 */
class HttpSessionManager implements SessionManager {
  private transports: Map<string, StreamableHTTPServerTransport> = new Map();

  getSession(sessionId: string): StreamableHTTPServerTransport | undefined {
    return this.transports.get(sessionId);
  }

  setSession(sessionId: string, transport: StreamableHTTPServerTransport): void {
    this.transports.set(sessionId, transport);
  }

  deleteSession(sessionId: string): void {
    this.transports.delete(sessionId);
  }

  hasSession(sessionId: string): boolean {
    return this.transports.has(sessionId);
  }

  clear(): void {
    this.transports.clear();
  }
}

/**
 * HTTP transport handler using Streamable HTTP (protocol version 2025-03-26)
 * Provides stateful session management with resumability support
 */
export class HttpTransportHandler implements IHttpTransportHandler {
  private mcpServer: McpServer;
  private app: express.Application;
  private server: HttpServer | null = null;
  private sessionManager: HttpSessionManager;
  private config: Required<TransportConfig>;

  constructor(mcpServer: McpServer, config: TransportConfig) {
    this.mcpServer = mcpServer;
    this.app = express();
    this.sessionManager = new HttpSessionManager();
    this.config = {
      mode: config.mode,
      port: config.port ?? 3000,
      host: config.host ?? 'localhost',
    };

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Handle POST requests for client-to-server communication
    this.app.post('/mcp', async (req: Request, res: Response) => {
      await this.handlePostRequest(req, res);
    });

    // Handle GET requests for server-to-client notifications via SSE
    this.app.get('/mcp', async (req: Request, res: Response) => {
      await this.handleGetRequest(req, res);
    });

    // Handle DELETE requests for session termination
    this.app.delete('/mcp', async (req: Request, res: Response) => {
      await this.handleDeleteRequest(req, res);
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', transport: 'http' });
    });
  }

  private async handlePostRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && this.sessionManager.hasSession(sessionId)) {
      // Reuse existing transport
      transport = this.sessionManager.getSession(sessionId)!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          this.sessionManager.setSession(sessionId, transport);
        },
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          this.sessionManager.deleteSession(transport.sessionId);
        }
      };

      // Connect to the MCP server
      await this.mcpServer.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  }

  private async handleGetRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !this.sessionManager.hasSession(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = this.sessionManager.getSession(sessionId)!;
    await transport.handleRequest(req, res);
  }

  private async handleDeleteRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !this.sessionManager.hasSession(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = this.sessionManager.getSession(sessionId)!;
    await transport.handleRequest(req, res);

    // Clean up session
    this.sessionManager.deleteSession(sessionId);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          console.error(
            `Scaffolding MCP server started on http://${this.config.host}:${this.config.port}/mcp`,
          );
          console.error(`Health check: http://${this.config.host}:${this.config.port}/health`);
          resolve();
        });

        this.server.on('error', (error: Error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        // Clear all sessions
        this.sessionManager.clear();

        this.server.close((err?: Error) => {
          if (err) {
            reject(err);
          } else {
            this.server = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getPort(): number {
    return this.config.port;
  }

  getHost(): string {
    return this.config.host;
  }
}
