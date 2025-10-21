
import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';

interface CodePreviewProps {
  code: Record<string, string> | null;
}

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


export const CodePreview: React.FC<CodePreviewProps> = ({ code }) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (code && !activeTab) {
      setActiveTab(Object.keys(code)[0]);
    }
  }, [code, activeTab]);

  if (!code) {
    return (
      <Card className="flex items-center justify-center h-96">
        <div className="text-center text-slate-500">
          <p className="text-lg">Click the "Generate & Preview Code" button</p>
          <p>to see the generated Python files here.</p>
        </div>
      </Card>
    );
  }

  const handleCopy = async (filename: string) => {
    try {
      await navigator.clipboard.writeText(code[filename]);
      setCopiedStates({ ...copiedStates, [filename]: true });
      setTimeout(() => {
        setCopiedStates(prev => ({...prev, [filename]: false}));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: show error state briefly
      alert('Failed to copy to clipboard. Please try selecting and copying manually.');
    }
  };

  const tabs = Object.keys(code);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="bg-slate-900/50 border-b border-slate-700 flex items-center">
        <div className="flex-grow flex space-x-1 p-2">
            {tabs.map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
            >
                {tab}
            </button>
            ))}
        </div>
        {activeTab && (
            <div className="pr-4">
                 <button onClick={() => handleCopy(activeTab)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    {copiedStates[activeTab] ? <CheckIcon /> : <ClipboardIcon />}
                    <span className="text-sm">{copiedStates[activeTab] ? 'Copied!' : 'Copy'}</span>
                </button>
            </div>
        )}
      </div>

      <div className="relative p-1 bg-slate-800">
        {activeTab && (
          <pre className="text-sm language-python overflow-auto h-[40rem] p-4 text-slate-200">
            <code>
              {code[activeTab]}
            </code>
          </pre>
        )}
      </div>
    </Card>
  );
};
