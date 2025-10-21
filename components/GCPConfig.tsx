import React from 'react';
import { GCPConfig as GCPConfigType } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';

interface GCPConfigProps {
    gcpConfig: GCPConfigType;
    updateGCPConfig: <K extends keyof GCPConfigType>(key: K, value: GCPConfigType[K]) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
)

export const GCPConfig: React.FC<GCPConfigProps> = ({ gcpConfig, updateGCPConfig, onFileChange }) => {
    return (
        <Card>
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-sky-400">GCP Deployment (Agent Engine)</h3>
                <p className="text-sm text-slate-400 -mt-2">
                    Configure your GCP settings to generate deployment files for Agent Engine, enabling managed features like Memory Bank.
                </p>
                <Input
                    label="GCP Project ID"
                    id="gcpProjectId"
                    value={gcpConfig.projectId}
                    onChange={(e) => updateGCPConfig('projectId', e.target.value)}
                    placeholder="your-gcp-project-id"
                />
                 <Input
                    label="Agent Engine Service Name"
                    id="gcpServiceName"
                    value={gcpConfig.serviceName}
                    onChange={(e) => updateGCPConfig('serviceName', e.target.value)}
                    placeholder="my-adk-agent"
                />
                <div>
                    <label htmlFor="gcpRegion" className="block text-sm font-medium text-slate-400 mb-2">
                        Region
                    </label>
                    <select
                        id="gcpRegion"
                        value={gcpConfig.region}
                        onChange={(e) => updateGCPConfig('region', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    >
                        <option value="us-central1">us-central1 (Iowa)</option>
                        <option value="us-east1">us-east1 (South Carolina)</option>
                        <option value="us-west1">us-west1 (Oregon)</option>
                        <option value="europe-west1">europe-west1 (Belgium)</option>
                        <option value="europe-west4">europe-west4 (Netherlands)</option>
                        <option value="asia-east1">asia-east1 (Taiwan)</option>
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-400 mb-2">
                        Service Account Key (JSON)
                    </label>
                    <label htmlFor="saKeyFile" className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 transition flex items-center justify-center cursor-pointer hover:bg-slate-600">
                        { gcpConfig.serviceAccountKeyName 
                            ? <><CheckCircleIcon/> <span className="ml-2 text-emerald-300">{gcpConfig.serviceAccountKeyName}</span></>
                            : <><UploadIcon /> <span>Upload Credentials File</span></>
                        }
                    </label>
                    <input
                        type="file"
                        id="saKeyFile"
                        accept=".json"
                        onChange={onFileChange}
                        className="hidden"
                    />
                    <p className="mt-1 text-xs text-yellow-500/80">
                        ⚠️ SECURITY: Credentials are validated but NOT included in the generated files.
                        You must download your service account key separately and configure it via environment variables.
                        See the generated README.md for secure setup instructions.
                    </p>
                </div>
                 <div className="border-t border-slate-700 pt-4 mt-2">
                    <div className="flex items-center justify-between">
                         <div>
                            <label htmlFor="useMemoryBank" className={`font-medium transition-colors ${gcpConfig.projectId ? 'text-slate-300' : 'text-slate-500'}`}>
                                Enable Memory Bank
                            </label>
                            <p className={`text-sm transition-colors ${gcpConfig.projectId ? 'text-slate-400' : 'text-slate-500'}`}>
                                Use GCP's managed, persistent memory. Requires deployment.
                            </p>
                        </div>
                         <label htmlFor="useMemoryBank" className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="useMemoryBank"
                                className="sr-only peer"
                                checked={gcpConfig.useMemoryBank}
                                onChange={e => updateGCPConfig('useMemoryBank', e.target.checked)}
                                disabled={!gcpConfig.projectId}
                            />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-sky-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </label>
                    </div>
                </div>
            </div>
        </Card>
    );
};