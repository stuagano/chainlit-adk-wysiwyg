import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Agent, Tool, ValidationErrors, GCPConfig as GCPConfigType, WorkflowType, PreflightValidationResult } from './types';
import { generateCode } from './services/codeGenerator';
import { runPreflightValidation } from './services/preflight';
import { loadState, saveState, clearState, getAutoSaveEnabled, setAutoSaveEnabled, getLastSaveTime } from './services/storage';
import { AgentConfig } from './components/AgentConfig';
import { ToolsConfig } from './components/ToolsConfig';
import { ChainlitConfig } from './components/ChainlitConfig';
import { CodePreview } from './components/CodePreview';
import { PreflightPanel } from './components/PreflightPanel';
import { RealtimeStatusPanel } from './components/RealtimeStatusPanel';
import { initialAgentsState, initialGCPState } from './constants';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GCPConfig } from './components/GCPConfig';
import { WorkflowDesigner } from './components/WorkflowDesigner';
import { postJson } from './utils/fetch';
import { gcpServiceAccountSchema, syncChainlitResponseSchema, launchChainlitResponseSchema, safeParseJson } from './utils/schemas';
import { logError, getErrorMessage, ValidationError } from './utils/errors';
import { useWebSocket } from './hooks/useWebSocket';

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const App: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(initialAgentsState);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(initialAgentsState[0]?.id || null);
  const [workflowType, setWorkflowType] = useState<WorkflowType>('Sequential');
  const [gcpConfig, setGcpConfig] = useState<GCPConfigType>(initialGCPState);
  const [generatedCode, setGeneratedCode] = useState<Record<string, string> | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({ tools: {} });
  const [preflightResult, setPreflightResult] = useState<PreflightValidationResult | null>(null);
  const [chainlitSyncStatus, setChainlitSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [chainlitSyncMessage, setChainlitSyncMessage] = useState('');
  const [autoSave, setAutoSave] = useState<boolean>(getAutoSaveEnabled());
  const [lastSaved, setLastSaved] = useState<Date | null>(getLastSaveTime());

  // Use ref to track if we've loaded initial state to avoid auto-save on mount
  const hasLoadedInitialState = useRef(false);

  // Generate or retrieve userId for WebSocket connection
  const [userId] = useState(() => {
    const stored = localStorage.getItem('userId');
    if (stored) return stored;
    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', newId);
    return newId;
  });

  // Initialize WebSocket connection
  const websocket = useWebSocket({
    url: (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001',
    userId,
    autoConnect: true,
  });

  const selectedAgent = useMemo(() => agents.find(a => a.id === selectedAgentId), [agents, selectedAgentId]);

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadState();
    if (savedState) {
      console.log('[Storage] Restored state from localStorage');
      if (savedState.agents) setAgents(savedState.agents);
      if (savedState.gcpConfig) setGcpConfig(prev => ({ ...prev, ...savedState.gcpConfig }));
      if (savedState.workflowType) setWorkflowType(savedState.workflowType);
      if (savedState.selectedAgentId) setSelectedAgentId(savedState.selectedAgentId);
      if (savedState.timestamp) setLastSaved(new Date(savedState.timestamp));
    }
    hasLoadedInitialState.current = true;
  }, []); // Run only once on mount

  // Auto-save state changes (debounced)
  useEffect(() => {
    // Don't auto-save on initial mount
    if (!hasLoadedInitialState.current || !autoSave) {
      return;
    }

    const saveTimeout = setTimeout(() => {
      const success = saveState({
        agents,
        gcpConfig,
        workflowType,
        selectedAgentId,
      });

      if (success) {
        setLastSaved(new Date());
        console.log('[Storage] Auto-saved state');
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveTimeout);
  }, [agents, gcpConfig, workflowType, selectedAgentId, autoSave]);

  // Update auto-save preference in localStorage when it changes
  useEffect(() => {
    setAutoSaveEnabled(autoSave);
  }, [autoSave]);

  const validateAgents = (currentAgents: Agent[]): { isValid: boolean, errors: ValidationErrors } => {
    const errors: ValidationErrors = { tools: {} };
    let isValid = true;

    currentAgents.forEach(agent => {
        agent.tools.forEach(tool => {
          const toolErrors: ValidationErrors['tools'][string] = { parameters: {} };
    
          if (!tool.name.trim()) {
            toolErrors.name = 'Tool name cannot be empty.';
            isValid = false;
          }
    
          tool.parameters.forEach(param => {
            const paramErrors: { name?: string; description?: string } = {};
            if (!param.name.trim()) {
              paramErrors.name = 'Parameter name cannot be empty.';
              isValid = false;
            }
            if (!param.description.trim()) {
              paramErrors.description = 'Parameter description cannot be empty.';
              isValid = false;
            }
    
            if (Object.keys(paramErrors).length > 0) {
              toolErrors.parameters[param.id] = paramErrors;
            }
          });
          
          if (toolErrors.name || Object.keys(toolErrors.parameters).length > 0) {
            errors.tools[tool.id] = toolErrors;
          }
        });
    });

    return { isValid, errors };
  };

  const handleGenerateCode = useCallback(() => {
    const { isValid: legacyValid, errors } = validateAgents(agents);
    setValidationErrors(errors);

    const result = runPreflightValidation({ agents });
    setPreflightResult(result);

    setChainlitSyncStatus('idle');
    setChainlitSyncMessage('');

    if (result.hasErrors) {
      setGeneratedCode(null);
      return;
    }

    if (legacyValid) {
      const code = generateCode(agents, gcpConfig, workflowType);
      setGeneratedCode(code);
    } else {
      setGeneratedCode(null);
    }
  }, [agents, gcpConfig, workflowType]);

  const handleSyncChainlit = useCallback(async () => {
    const latestPreflight = runPreflightValidation({ agents });
    setPreflightResult(latestPreflight);

    if (latestPreflight.hasErrors) {
      setChainlitSyncStatus('error');
      setChainlitSyncMessage('Cannot sync: fix validation errors first.');
      return;
    }

    if (!generatedCode) {
      setChainlitSyncStatus('error');
      setChainlitSyncMessage('Generate code before syncing to Chainlit.');
      return;
    }

    try {
      setChainlitSyncStatus('syncing');
      setChainlitSyncMessage('');

      // Sync files with retry and timeout
      const syncResult = await postJson<{ files: Record<string, string> }, unknown>(
        '/api/sync-chainlit',
        { files: generatedCode },
        {
          timeout: 30000, // 30 seconds
          retries: 3,
          headers: {
            'X-User-Id': userId,
          },
        }
      );

      // Validate sync response
      const syncValidation = syncChainlitResponseSchema.safeParse(syncResult);
      if (!syncValidation.success || !syncValidation.data.success) {
        throw new ValidationError(
          syncValidation.success ? syncValidation.data.error || 'Failed to sync files' : 'Invalid sync response'
        );
      }

      // Launch Chainlit with retry and timeout
      const launchResult = await postJson<Record<string, never>, unknown>(
        '/api/launch-chainlit',
        {},
        {
          timeout: 30000, // 30 seconds
          retries: 2,
          headers: {
            'X-User-Id': userId,
          },
        }
      );

      // Validate launch response
      const launchValidation = launchChainlitResponseSchema.safeParse(launchResult);
      if (!launchValidation.success || !launchValidation.data.success) {
        throw new ValidationError(
          launchValidation.success ? launchValidation.data.error || 'Failed to launch Chainlit' : 'Invalid launch response'
        );
      }

      window.open('http://localhost:8000', '_blank');

      setChainlitSyncStatus('success');
      setChainlitSyncMessage('Synced to chainlit_app/. Chainlit preview opened in new tab.');
    } catch (error) {
      logError(error, { component: 'App', operation: 'handleSyncChainlit' });
      setChainlitSyncStatus('error');
      setChainlitSyncMessage(getErrorMessage(error));
    }
  }, [agents, generatedCode, userId]);

  const handleDownloadCode = () => {
    if (!generatedCode) return;

    const zip = new JSZip();
    Object.keys(generatedCode).forEach(filename => {
        const content = generatedCode[filename];
        if (content !== undefined) {
          zip.file(filename, content);
        }
    });

    zip.generateAsync({ type: 'blob' })
      .then((content: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `multi-agent-workflow.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      })
      .catch((error) => {
        logError(error, { component: 'App', operation: 'handleDownloadCode' });
        alert('Failed to create download file. Please try again.');
      });
  };

  const updateAgent = (agentId: string, update: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, ...update } : agent
    ));
  };
  
  const updateGCPConfig = <K extends keyof GCPConfigType>(key: K, value: GCPConfigType[K]) => {
    setGcpConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSAKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        alert('Invalid file type. Please upload a JSON file.');
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate file size (max 100KB for service account key)
      const MAX_FILE_SIZE = 100 * 1024; // 100KB
      if (file.size > MAX_FILE_SIZE) {
        alert('File is too large. Service account key files should be under 100KB.');
        e.target.value = ''; // Clear the input
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;

          // Validate JSON and service account schema
          const validation = safeParseJson(gcpServiceAccountSchema, content, 'GCP Service Account Key');

          if (!validation.success) {
            alert(`Invalid GCP service account key:\n${validation.error.issues.map(i => `• ${i.message}`).join('\n')}`);
            updateGCPConfig('serviceAccountKeyJson', '');
            updateGCPConfig('serviceAccountKeyName', '');
            e.target.value = ''; // Clear the input
            logError(
              new ValidationError('Invalid service account key uploaded', {
                filename: file.name,
                error: validation.error.message,
              })
            );
            return;
          }

          // Successfully validated
          updateGCPConfig('serviceAccountKeyJson', content);
          updateGCPConfig('serviceAccountKeyName', file.name);
        } catch (error) {
          logError(error, { component: 'App', operation: 'handleSAKeyFileChange' });
          alert('Failed to process service account key file. Please try again.');
          updateGCPConfig('serviceAccountKeyJson', '');
          updateGCPConfig('serviceAccountKeyName', '');
          e.target.value = ''; // Clear the input
        }
      };
      reader.onerror = (error) => {
        logError(error, { component: 'App', operation: 'handleSAKeyFileChange', filename: file.name });
        alert('Failed to read the service account key file. Please try again.');
        updateGCPConfig('serviceAccountKeyJson', '');
        updateGCPConfig('serviceAccountKeyName', '');
        e.target.value = ''; // Clear the input
      };
      reader.readAsText(file);
    } else {
        updateGCPConfig('serviceAccountKeyJson', '');
        updateGCPConfig('serviceAccountKeyName', '');
    }
  };


  const updateTools = (agentId: string, tools: Tool[]) => {
    setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, tools } : agent
      ));
  };
  
  const resetForm = () => {
    if (!confirm('Reset to default configuration? This will clear all agents and saved state.')) {
      return;
    }

    const newInitialState = initialAgentsState.map(a => ({...a, id: crypto.randomUUID(), parentId: null}));
    setAgents(newInitialState);
    const firstAgent = newInitialState[0];
    if (firstAgent) {
      setSelectedAgentId(firstAgent.id);
    }
    setGcpConfig(initialGCPState);
    setValidationErrors({ tools: {} });
    setPreflightResult(null);
    setGeneratedCode(null);
    setWorkflowType('Sequential');
    setChainlitSyncStatus('idle');
    setChainlitSyncMessage('');

    // Clear saved state from localStorage
    clearState();
    setLastSaved(null);
    console.log('[Storage] Cleared saved state');
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-slate-200 border-b border-slate-700 pb-2">Configuration</h2>
          <WorkflowDesigner 
            agents={agents}
            setAgents={setAgents}
            selectedAgentId={selectedAgentId}
            setSelectedAgentId={setSelectedAgentId}
            workflowType={workflowType}
            setWorkflowType={setWorkflowType}
           />
           {selectedAgent ? (
            <>
              <AgentConfig agent={selectedAgent} updateAgent={(key, value) => updateAgent(selectedAgent.id, { [key]: value })} />
              <ChainlitConfig agent={selectedAgent} updateAgent={(key, value) => updateAgent(selectedAgent.id, { [key]: value })} />
              <ToolsConfig 
                tools={selectedAgent.tools} 
                updateTools={(tools) => updateTools(selectedAgent.id, tools)}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
              />
            </>
           ) : (
            <div className="flex items-center justify-center h-64 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-slate-500">Select an agent to configure its details.</p>
            </div>
           )}
          <GCPConfig
            gcpConfig={gcpConfig}
            updateGCPConfig={updateGCPConfig}
            onFileChange={handleSAKeyFileChange}
            />
        </div>

        <div className="flex flex-col gap-6 sticky top-8">
            <h2 className="text-2xl font-bold text-slate-200 border-b border-slate-700 pb-2">Actions & Preview</h2>
            <PreflightPanel result={preflightResult} />
            <RealtimeStatusPanel websocket={websocket} />
             <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center">
                <button
                onClick={handleGenerateCode}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-400"
                >
                ✨ Generate Code
                </button>
                <button
                   onClick={handleDownloadCode}
                    disabled={!generatedCode}
                    className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-400 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    >
                    <DownloadIcon />
                    Download .zip
                </button>
                <button
                   onClick={handleSyncChainlit}
                    disabled={!generatedCode || chainlitSyncStatus === 'syncing' || (preflightResult?.hasErrors ?? false)}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-300 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none disabled:shadow-none"
                    >
                    {chainlitSyncStatus === 'syncing' ? 'Syncing…' : 'Sync to Chainlit'}
                </button>
                 <button
                    onClick={resetForm}
                    className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                    Reset Form
                </button>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span>Auto-save</span>
              </label>
              {lastSaved && (
                <span className="text-xs">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            {chainlitSyncMessage && (
              <p
                className={`text-sm ${
                  chainlitSyncStatus === 'error'
                    ? 'text-red-400'
                    : chainlitSyncStatus === 'success'
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                }`}
              >
                {chainlitSyncMessage}
              </p>
            )}
            <CodePreview code={generatedCode} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
