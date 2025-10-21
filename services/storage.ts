/**
 * State Persistence Service
 *
 * Manages localStorage persistence for agent configurations
 * and application state
 */

import { Agent, GCPConfig, WorkflowType } from '../types';

const STORAGE_VERSION = '1.0.0';
const STORAGE_KEYS = {
  AGENTS: 'chainlit_adk_agents',
  GCP_CONFIG: 'chainlit_adk_gcp_config',
  WORKFLOW_TYPE: 'chainlit_adk_workflow_type',
  SELECTED_AGENT: 'chainlit_adk_selected_agent',
  VERSION: 'chainlit_adk_version',
  AUTO_SAVE_ENABLED: 'chainlit_adk_auto_save_enabled',
} as const;

export interface AppState {
  agents: Agent[];
  gcpConfig: Partial<GCPConfig>;
  workflowType: WorkflowType;
  selectedAgentId: string | null;
  version: string;
  timestamp: string;
}

/**
 * Checks if localStorage is available and working
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves application state to localStorage
 */
export function saveState(state: Partial<AppState>): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, state not saved');
    return false;
  }

  try {
    const timestamp = new Date().toISOString();

    if (state.agents !== undefined) {
      localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(state.agents));
    }

    if (state.gcpConfig !== undefined) {
      // Don't save sensitive credentials
      const safeConfig = { ...state.gcpConfig };
      delete safeConfig.serviceAccountKeyJson;
      delete safeConfig.serviceAccountKeyName;
      localStorage.setItem(STORAGE_KEYS.GCP_CONFIG, JSON.stringify(safeConfig));
    }

    if (state.workflowType !== undefined) {
      localStorage.setItem(STORAGE_KEYS.WORKFLOW_TYPE, state.workflowType);
    }

    if (state.selectedAgentId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_AGENT, state.selectedAgentId || '');
    }

    localStorage.setItem(STORAGE_KEYS.VERSION, state.version || STORAGE_VERSION);

    // Store timestamp of last save
    localStorage.setItem('chainlit_adk_last_save', timestamp);

    return true;
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
    return false;
  }
}

/**
 * Loads application state from localStorage
 */
export function loadState(): Partial<AppState> | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);

    // Check version compatibility
    if (version && version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch: ${version} !== ${STORAGE_VERSION}`);
      // Could implement migration logic here
    }

    const agentsJson = localStorage.getItem(STORAGE_KEYS.AGENTS);
    const gcpConfigJson = localStorage.getItem(STORAGE_KEYS.GCP_CONFIG);
    const workflowType = localStorage.getItem(STORAGE_KEYS.WORKFLOW_TYPE) as WorkflowType | null;
    const selectedAgentId = localStorage.getItem(STORAGE_KEYS.SELECTED_AGENT);
    const lastSave = localStorage.getItem('chainlit_adk_last_save');

    if (!agentsJson) {
      return null; // No saved state
    }

    const agents: Agent[] = JSON.parse(agentsJson);
    const gcpConfig: Partial<GCPConfig> = gcpConfigJson ? JSON.parse(gcpConfigJson) : {};

    return {
      agents,
      gcpConfig,
      workflowType: workflowType || 'Sequential',
      selectedAgentId: selectedAgentId || null,
      version: version || STORAGE_VERSION,
      timestamp: lastSave || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clears all saved state from localStorage
 */
export function clearState(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('chainlit_adk_last_save');
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Gets auto-save preference
 */
export function getAutoSaveEnabled(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  const value = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE_ENABLED);
  return value === null ? true : value === 'true'; // Default to enabled
}

/**
 * Sets auto-save preference
 */
export function setAutoSaveEnabled(enabled: boolean): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_SAVE_ENABLED, String(enabled));
    return true;
  } catch (error) {
    console.error('Failed to set auto-save preference:', error);
    return false;
  }
}

/**
 * Gets the last save timestamp
 */
export function getLastSaveTime(): Date | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  const timestamp = localStorage.getItem('chainlit_adk_last_save');
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Exports state as JSON for backup/sharing
 */
export function exportState(): string | null {
  const state = loadState();
  if (!state) {
    return null;
  }

  return JSON.stringify(state, null, 2);
}

/**
 * Imports state from JSON backup
 */
export function importState(json: string): boolean {
  try {
    const state = JSON.parse(json) as Partial<AppState>;

    // Validate the imported state
    if (!state.agents || !Array.isArray(state.agents)) {
      throw new Error('Invalid state: agents must be an array');
    }

    return saveState(state);
  } catch (error) {
    console.error('Failed to import state:', error);
    return false;
  }
}
