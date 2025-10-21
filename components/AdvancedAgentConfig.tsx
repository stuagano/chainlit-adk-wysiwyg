import React from 'react';
import { Agent } from '../types';

interface AdvancedAgentConfigProps {
  agent: Agent;
  updateAgent: (key: keyof Agent, value: any) => void;
}

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


export const AdvancedAgentConfig: React.FC<AdvancedAgentConfigProps> = ({ agent, updateAgent }) => {
    return (
        <details className="group">
            <summary className="cursor-pointer list-none flex justify-between items-center py-2">
                <span className="font-semibold text-slate-400 group-hover:text-slate-200">Advanced LLM Settings</span>
                <ChevronDownIcon />
            </summary>
            <div className="mt-4 flex flex-col gap-4 border-t border-slate-700 pt-4">
                 <div>
                    <label htmlFor="llmModel" className="block text-sm font-medium text-slate-400 mb-2">
                        LLM Model
                    </label>
                    <select
                        id="llmModel"
                        value={agent.llmModel}
                        onChange={(e) => updateAgent('llmModel', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gpt-4o">OpenAI GPT-4o</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="temperature" className="block text-sm font-medium text-slate-400 mb-2">
                        Temperature: <span className="font-mono bg-slate-700 px-2 py-1 rounded-md">{agent.temperature.toFixed(2)}</span>
                    </label>
                    <input
                        type="range"
                        id="temperature"
                        min="0"
                        max="2"
                        step="0.01"
                        value={agent.temperature}
                        onChange={(e) => updateAgent('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                    />
                </div>
            </div>
        </details>
    )
}
