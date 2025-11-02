/**
 * WebSocket Hook
 *
 * Custom React hook for managing WebSocket connection using Socket.IO client
 * Provides real-time updates for:
 * - Queue position
 * - Sync progress
 * - Preview status
 * - Code generation progress
 * - Notifications and errors
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface QueuePosition {
  position: number;
  total: number;
  estimatedWaitTime?: number;
}

export interface SyncProgress {
  stage: 'validating' | 'syncing' | 'launching' | 'complete';
  progress: number;
  message: string;
}

export interface PreviewStatus {
  status: 'idle' | 'starting' | 'running' | 'ready' | 'error';
  message?: string;
  url?: string;
}

export interface GenerationProgress {
  file: string;
  progress: number;
  total: number;
}

export interface WebSocketNotification {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface WebSocketError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface UseWebSocketReturn {
  connected: boolean;
  queuePosition: QueuePosition | null;
  syncProgress: SyncProgress | null;
  previewStatus: PreviewStatus | null;
  generationProgress: GenerationProgress | null;
  notifications: WebSocketNotification[];
  errors: WebSocketError[];
  clearNotifications: () => void;
  clearErrors: () => void;
}

interface UseWebSocketOptions {
  url?: string;
  userId: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url = 'http://localhost:3001',
    userId,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  const [errors, setErrors] = useState<WebSocketError[]>([]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    // Initialize Socket.IO client
    const socket = io(url, {
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket.id);
      setConnected(true);

      // Join with userId
      socket.emit('client:join', userId);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setConnected(false);

      // Reset state on disconnect
      setQueuePosition(null);
      setSyncProgress(null);
      setPreviewStatus(null);
      setGenerationProgress(null);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      setErrors(prev => [...prev, {
        message: `Connection error: ${error.message}`,
        code: 'CONNECTION_ERROR',
      }]);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      setNotifications(prev => [...prev, {
        type: 'success',
        message: 'Reconnected to server',
      }]);
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      setErrors(prev => [...prev, {
        message: 'Failed to reconnect to server',
        code: 'RECONNECTION_FAILED',
      }]);
    });

    // Event handlers for real-time updates
    socket.on('queue:position', (data: QueuePosition) => {
      console.log('[WebSocket] Queue position:', data);
      setQueuePosition(data);
    });

    socket.on('sync:progress', (data: SyncProgress) => {
      console.log('[WebSocket] Sync progress:', data);
      setSyncProgress(data);
    });

    socket.on('preview:status', (data: PreviewStatus) => {
      console.log('[WebSocket] Preview status:', data);
      setPreviewStatus(data);
    });

    socket.on('generation:progress', (data: GenerationProgress) => {
      console.log('[WebSocket] Generation progress:', data);
      setGenerationProgress(data);
    });

    socket.on('notification', (data: WebSocketNotification) => {
      console.log('[WebSocket] Notification:', data);
      setNotifications(prev => [...prev, data]);

      // Auto-clear non-error notifications after 5 seconds
      if (data.type !== 'error') {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n !== data));
        }, 5000);
      }
    });

    socket.on('error', (data: WebSocketError) => {
      console.error('[WebSocket] Error:', data);
      setErrors(prev => [...prev, data]);
    });

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Cleaning up connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, userId, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

  return {
    connected,
    queuePosition,
    syncProgress,
    previewStatus,
    generationProgress,
    notifications,
    errors,
    clearNotifications,
    clearErrors,
  };
}
