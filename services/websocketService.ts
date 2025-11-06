/**
 * WebSocket Service
 *
 * Manages real-time communication between frontend and backend using Socket.IO
 * Provides:
 * - Queue position updates
 * - Preview status notifications
 * - Code generation progress streaming
 * - Error notifications
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'node:http';

export interface WebSocketEvents {
  // Client -> Server
  'client:join': (userId: string) => void;
  'client:disconnect': () => void;

  // Server -> Client
  'queue:position': (data: { position: number; total: number; estimatedWaitTime?: number }) => void;
  'sync:progress': (data: { stage: 'validating' | 'syncing' | 'launching' | 'complete'; progress: number; message: string }) => void;
  'preview:status': (data: { status: 'idle' | 'starting' | 'running' | 'ready' | 'error'; message?: string; url?: string }) => void;
  'generation:progress': (data: { file: string; progress: number; total: number }) => void;
  'error': (data: { message: string; code?: string; details?: unknown }) => void;
  'notification': (data: { type: 'info' | 'success' | 'warning' | 'error'; message: string }) => void;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Socket> = new Map();
  private socketUsers: Map<string, string> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer, corsOrigin: string): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        type: 'websocket_connection',
        socketId: socket.id,
      }));

      // Handle user joining
      socket.on('client:join', (userId: string) => {
        // Remove any existing socket for this user
        const existingSocket = this.userSockets.get(userId);
        if (existingSocket && existingSocket.id !== socket.id) {
          this.socketUsers.delete(existingSocket.id);
        }

        this.userSockets.set(userId, socket);
        this.socketUsers.set(socket.id, userId);

        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          type: 'user_joined',
          userId,
          socketId: socket.id,
          totalConnections: this.userSockets.size,
        }));

        socket.emit('notification', {
          type: 'success',
          message: 'Connected to real-time updates',
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);

          console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            type: 'user_disconnected',
            userId,
            socketId: socket.id,
            totalConnections: this.userSockets.size,
          }));
        }
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          type: 'websocket_error',
          socketId: socket.id,
          error: error.message,
        }));
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Send queue position update to a specific user
   */
  sendQueuePosition(userId: string, position: number, total: number, estimatedWaitTime?: number): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('queue:position', { position, total, estimatedWaitTime });
    }
  }

  /**
   * Broadcast queue updates to all connected users in the queue
   */
  broadcastQueueUpdates(queueData: Array<{ userId: string; position: number; estimatedWaitTime?: number }>): void {
    const total = queueData.length;
    queueData.forEach(({ userId, position, estimatedWaitTime }) => {
      this.sendQueuePosition(userId, position, total, estimatedWaitTime);
    });
  }

  /**
   * Send sync progress update to a specific user
   */
  sendSyncProgress(
    userId: string,
    stage: 'validating' | 'syncing' | 'launching' | 'complete',
    progress: number,
    message: string
  ): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('sync:progress', { stage, progress, message });
    }
  }

  /**
   * Send preview status update to a specific user
   */
  sendPreviewStatus(
    userId: string,
    status: 'idle' | 'starting' | 'running' | 'ready' | 'error',
    message?: string,
    url?: string
  ): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('preview:status', { status, message, url });
    }
  }

  /**
   * Send code generation progress update to a specific user
   */
  sendGenerationProgress(userId: string, file: string, progress: number, total: number): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('generation:progress', { file, progress, total });
    }
  }

  /**
   * Send error notification to a specific user
   */
  sendError(userId: string, message: string, code?: string, details?: unknown): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('error', { message, code, details });
    }
  }

  /**
   * Send notification to a specific user
   */
  sendNotification(userId: string, type: 'info' | 'success' | 'warning' | 'error', message: string): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('notification', { type, message });
    }
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastNotification(type: 'info' | 'success' | 'warning' | 'error', message: string): void {
    if (this.io) {
      this.io.emit('notification', { type, message });
    }
  }

  /**
   * Get number of connected users
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if a user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Disconnect a specific user
   */
  disconnectUser(userId: string): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.disconnect(true);
      this.userSockets.delete(userId);
      this.socketUsers.delete(socket.id);
    }
  }

  /**
   * Get WebSocket server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.io) {
      this.io.close();
      this.userSockets.clear();
      this.socketUsers.clear();
      console.log('WebSocket server shut down');
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
