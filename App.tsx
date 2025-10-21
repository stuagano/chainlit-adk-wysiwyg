import React, { useState, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import { Agent, Tool, ValidationErrors, GCPConfig as GCPConfigType, WorkflowType, PreflightValidationResult } from './types';
import { generateCode } from './services/codeGenerator';
import { runPreflightValidation } from './services/preflight';
import { AgentConfig } from './components/AgentConfig';
import { ToolsConfig } from './components/ToolsConfig';
import { ChainlitConfig } from './components/ChainlitConfig';
import { CodePreview } from './components/CodePreview';
import { PreflightPanel } from './components/PreflightPanel';
import { initialAgentsState, initialGCPState } from './constants';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GCPConfig } from './components/GCPConfig';
import { WorkflowDesigner } from './components/WorkflowDesigner';

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

  const selectedAgent = useMemo(() => agents.find(a => a.id === selectedAgentId), [agents, selectedAgentId]);

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

      const response = await fetch('/api/sync-chainlit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: generatedCode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || 'Failed to sync Chainlit files');
      }

      const launchResponse = await fetch('/api/launch-chainlit', { method: 'POST' });

      if (!launchResponse.ok) {
        const data = await launchResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || 'Failed to launch Chainlit preview');
      }

      window.open('http://localhost:8000', '_blank');

      setChainlitSyncStatus('success');
      setChainlitSyncMessage('Synced to chainlit_app/. Chainlit preview opened in new tab.');
    } catch (error) {
      console.error(error);
      setChainlitSyncStatus('error');
      setChainlitSyncMessage(error instanceof Error ? error.message : 'Failed to sync Chainlit files');
    }
  }, [agents, generatedCode]);

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
        console.error('Failed to generate ZIP file:', error);
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

          // Validate JSON structure
          const parsed = JSON.parse(content);

          // Validate it looks like a GCP service account key
          if (parsed.type !== 'service_account') {
            alert('Invalid GCP service account key. The file must contain a service account key with type "service_account".');
            updateGCPConfig('serviceAccountKeyJson', '');
            updateGCPConfig('serviceAccountKeyName', '');
            e.target.value = ''; // Clear the input
            return;
          }

          // Additional validation for required fields
          const requiredFields = ['project_id', 'private_key_id', 'private_key', 'client_email'];
          const missingFields = requiredFields.filter(field => !parsed[field]);
          if (missingFields.length > 0) {
            alert(`Invalid GCP service account key. Missing required fields: ${missingFields.join(', ')}`);
            updateGCPConfig('serviceAccountKeyJson', '');
            updateGCPConfig('serviceAccountKeyName', '');
            e.target.value = ''; // Clear the input
            return;
          }

          updateGCPConfig('serviceAccountKeyJson', content);
          updateGCPConfig('serviceAccountKeyName', file.name);
        } catch (error) {
          console.error('Failed to parse JSON:', error);
          alert('Invalid JSON file. Please upload a valid GCP service account key.');
          updateGCPConfig('serviceAccountKeyJson', '');
          updateGCPConfig('serviceAccountKeyName', '');
          e.target.value = ''; // Clear the input
        }
      };
      reader.onerror = (error) => {
        console.error('Failed to read file:', error);
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
