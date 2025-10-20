
import React from 'react';
import { Tool, Parameter, ValidationErrors, ToolValidationError, ParameterValidationError } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Textarea } from './common/Textarea';

interface ToolsConfigProps {
    tools: Tool[];
    updateTools: (tools: Tool[]) => void;
    validationErrors: ValidationErrors;
    setValidationErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


export const ToolsConfig: React.FC<ToolsConfigProps> = ({ tools, updateTools, validationErrors, setValidationErrors }) => {
    
    const addTool = () => {
        const newTool: Tool = {
            id: crypto.randomUUID(),
            name: ``,
            description: '',
            parameters: [],
        };
        updateTools([...tools, newTool]);
    };

    const removeTool = (id: string) => {
        updateTools(tools.filter(tool => tool.id !== id));
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.tools[id];
            return newErrors;
        });
    };

    const clearToolError = (toolId: string, field: keyof ToolValidationError) => {
        setValidationErrors(prev => {
            const newErrors = JSON.parse(JSON.stringify(prev));
            if (newErrors.tools[toolId]) {
                delete newErrors.tools[toolId][field];
                if (!newErrors.tools[toolId].name && Object.keys(newErrors.tools[toolId].parameters).length === 0) {
                    delete newErrors.tools[toolId];
                }
            }
            return newErrors;
        });
    };

    const clearParameterError = (toolId: string, paramId: string, field: keyof ParameterValidationError) => {
        setValidationErrors(prev => {
            const newErrors = JSON.parse(JSON.stringify(prev));
            if (newErrors.tools[toolId]?.parameters[paramId]) {
                delete newErrors.tools[toolId].parameters[paramId][field];
                if (Object.keys(newErrors.tools[toolId].parameters[paramId]).length === 0) {
                    delete newErrors.tools[toolId].parameters[paramId];
                }
                if (!newErrors.tools[toolId].name && Object.keys(newErrors.tools[toolId].parameters).length === 0) {
                    delete newErrors.tools[toolId];
                }
            }
            return newErrors;
        });
    };

    const updateTool = (id: string, field: keyof Tool, value: any) => {
        if (field === 'name') {
            clearToolError(id, 'name');
        }
        const newTools = tools.map(tool => tool.id === id ? { ...tool, [field]: value } : tool);
        updateTools(newTools);
    };

    const addParameter = (toolId: string) => {
        const newParam: Parameter = {
            id: crypto.randomUUID(),
            name: '',
            type: 'string',
            description: '',
            required: true,
        };
        const newTools = tools.map(tool => {
            if (tool.id === toolId) {
                return { ...tool, parameters: [...tool.parameters, newParam] };
            }
            return tool;
        });
        updateTools(newTools);
    };

    const removeParameter = (toolId: string, paramId: string) => {
        const newTools = tools.map(tool => {
            if (tool.id === toolId) {
                return { ...tool, parameters: tool.parameters.filter(p => p.id !== paramId) };
            }
            return tool;
        });
        updateTools(newTools);
    };

    const updateParameter = (toolId: string, paramId: string, field: keyof Parameter, value: any) => {
        if (field === 'name' || field === 'description') {
            clearParameterError(toolId, paramId, field);
        }
        const newTools = tools.map(tool => {
            if (tool.id === toolId) {
                const newParams = tool.parameters.map(p => p.id === paramId ? { ...p, [field]: value } : p);
                return { ...tool, parameters: newParams };
            }
            return tool;
        });
        updateTools(newTools);
    };


    return (
        <Card>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-emerald-400">Agent Tools</h3>
                    <button onClick={addTool} className="flex items-center bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        <PlusIcon /> Add Tool
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    {tools.map(tool => {
                        const toolErrors = validationErrors.tools[tool.id];
                        return (
                        <div key={tool.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                             <div className="flex justify-between items-start gap-2">
                                <div className="flex-grow flex flex-col gap-4">
                                     <Input label="Tool Name" id={`tool-name-${tool.id}`} value={tool.name} onChange={e => updateTool(tool.id, 'name', e.target.value)} placeholder="e.g., get_weather" error={toolErrors?.name} />
                                    <Textarea label="Tool Description" id={`tool-desc-${tool.id}`} value={tool.description} onChange={e => updateTool(tool.id, 'description', e.target.value)} rows={2} placeholder="A short description of what this tool does."/>
                                </div>
                                <button onClick={() => removeTool(tool.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 mt-8">
                                    <TrashIcon />
                                </button>
                            </div>
                            
                            <div className="mt-4 pl-4 border-l-2 border-slate-600">
                                <h4 className="font-semibold text-slate-300 mb-2">Parameters</h4>
                                {tool.parameters.map(param => {
                                    const paramErrors = toolErrors?.parameters[param.id];
                                    return (
                                    <div key={param.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-slate-900/30 p-3 rounded-md mb-2">
                                        <Input label="Name" id={`param-name-${param.id}`} value={param.name} onChange={e => updateParameter(tool.id, param.id, 'name', e.target.value)} error={paramErrors?.name} />
                                        <div className="flex flex-col">
                                            <label htmlFor={`param-type-${param.id}`} className="block text-sm font-medium text-slate-400 mb-2">Type</label>
                                            <select id={`param-type-${param.id}`} value={param.type} onChange={e => updateParameter(tool.id, param.id, 'type', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
                                                <option value="string">string</option>
                                                <option value="number">number</option>
                                                <option value="boolean">boolean</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input label="Description" id={`param-desc-${param.id}`} value={param.description} onChange={e => updateParameter(tool.id, param.id, 'description', e.target.value)} error={paramErrors?.description} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 mt-2">
                                                <input type="checkbox" id={`param-req-${param.id}`} checked={param.required} onChange={e => updateParameter(tool.id, param.id, 'required', e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-emerald-600 focus:ring-emerald-500"/>
                                                <label htmlFor={`param-req-${param.id}`} className="text-sm text-slate-300">Required</label>
                                            </div>
                                            <button onClick={() => removeParameter(tool.id, param.id)} className="text-slate-500 hover:text-red-500 transition-colors p-1">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                )})}
                                <button onClick={() => addParameter(tool.id)} className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold mt-2 flex items-center">
                                    <PlusIcon /> Add Parameter
                                </button>
                            </div>
                        </div>
                    )})}
                     {tools.length === 0 && <p className="text-center text-slate-500 py-4">No tools defined. Click "Add Tool" to get started.</p>}
                </div>
            </div>
        </Card>
    );
};
