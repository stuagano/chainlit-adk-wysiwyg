/**
 * Real-time Status Panel Component
 *
 * Displays real-time updates from WebSocket:
 * - Connection status
 * - Queue position
 * - Sync progress
 * - Preview status
 * - Notifications
 */

import React from 'react';
import {
  UseWebSocketReturn,
  QueuePosition,
  SyncProgress,
  PreviewStatus,
  WebSocketNotification,
} from '../hooks/useWebSocket';

interface RealtimeStatusPanelProps {
  websocket: UseWebSocketReturn;
}

const ConnectionIndicator: React.FC<{ connected: boolean }> = ({ connected }) => (
  <div className="flex items-center gap-2 text-xs">
    <div
      className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
      aria-label={connected ? 'Connected' : 'Disconnected'}
    />
    <span className="text-slate-400">
      {connected ? 'Live updates active' : 'Reconnecting...'}
    </span>
  </div>
);

const QueuePositionDisplay: React.FC<{ queuePosition: QueuePosition }> = ({ queuePosition }) => {
  const { position, total, estimatedWaitTime } = queuePosition;

  return (
    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold text-blue-300">Queue Position</span>
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-slate-200">
          Position <span className="font-bold text-blue-400">#{position}</span> of {total}
        </p>
        {estimatedWaitTime && (
          <p className="text-slate-400">
            Estimated wait: ~{Math.ceil(estimatedWaitTime / 1000)}s
          </p>
        )}
      </div>
    </div>
  );
};

const SyncProgressDisplay: React.FC<{ syncProgress: SyncProgress }> = ({ syncProgress }) => {
  const { stage, progress, message } = syncProgress;

  const stageColors = {
    validating: 'bg-yellow-500',
    syncing: 'bg-blue-500',
    launching: 'bg-purple-500',
    complete: 'bg-green-500',
  };

  const stageIcons = {
    validating: '🔍',
    syncing: '📦',
    launching: '🚀',
    complete: '✅',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{stageIcons[stage]}</span>
        <span className="font-semibold text-slate-200 capitalize">{stage}</span>
      </div>
      <div className="space-y-2">
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${stageColors[stage]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">{message}</p>
      </div>
    </div>
  );
};

const PreviewStatusDisplay: React.FC<{ previewStatus: PreviewStatus }> = ({ previewStatus }) => {
  const { status, message, url } = previewStatus;

  const statusColors = {
    idle: 'bg-slate-600 text-slate-300',
    starting: 'bg-yellow-600 text-yellow-100 animate-pulse',
    running: 'bg-blue-600 text-blue-100',
    ready: 'bg-green-600 text-green-100',
    error: 'bg-red-600 text-red-100',
  };

  const statusIcons = {
    idle: '⚪',
    starting: '🔄',
    running: '⚙️',
    ready: '✅',
    error: '❌',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{statusIcons[status]}</span>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}>
          {status.toUpperCase()}
        </span>
      </div>
      {message && <p className="text-sm text-slate-300 mb-2">{message}</p>}
      {url && status === 'ready' && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Open Preview →
        </a>
      )}
    </div>
  );
};

const NotificationDisplay: React.FC<{
  notifications: WebSocketNotification[];
  onClear: () => void;
}> = ({ notifications, onClear }) => {
  if (notifications.length === 0) return null;

  const typeColors = {
    info: 'bg-blue-900/40 border-blue-500/50 text-blue-200',
    success: 'bg-green-900/40 border-green-500/50 text-green-200',
    warning: 'bg-yellow-900/40 border-yellow-500/50 text-yellow-200',
    error: 'bg-red-900/40 border-red-500/50 text-red-200',
  };

  const typeIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-300">Notifications</span>
        <button
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-slate-200 transition"
        >
          Clear all
        </button>
      </div>
      {notifications.slice(-3).reverse().map((notification, index) => (
        <div
          key={index}
          className={`flex items-start gap-2 border rounded p-2 ${typeColors[notification.type]}`}
        >
          <span className="text-base mt-0.5">{typeIcons[notification.type]}</span>
          <p className="text-sm flex-1">{notification.message}</p>
        </div>
      ))}
    </div>
  );
};

export const RealtimeStatusPanel: React.FC<RealtimeStatusPanelProps> = ({ websocket }) => {
  const {
    connected,
    queuePosition,
    syncProgress,
    previewStatus,
    notifications,
    clearNotifications,
  } = websocket;

  const hasUpdates = queuePosition || syncProgress || previewStatus || notifications.length > 0;

  if (!hasUpdates && connected) {
    return (
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
        <ConnectionIndicator connected={connected} />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-200">Real-time Status</h3>
        <ConnectionIndicator connected={connected} />
      </div>

      {queuePosition && <QueuePositionDisplay queuePosition={queuePosition} />}
      {syncProgress && <SyncProgressDisplay syncProgress={syncProgress} />}
      {previewStatus && <PreviewStatusDisplay previewStatus={previewStatus} />}
      {notifications.length > 0 && (
        <NotificationDisplay notifications={notifications} onClear={clearNotifications} />
      )}
    </div>
  );
};
