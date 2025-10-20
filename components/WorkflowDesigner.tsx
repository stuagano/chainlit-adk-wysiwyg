import React, { useState, useMemo } from 'react';
import { Agent, WorkflowType } from '../types';
import { Card } from './common/Card';
import { createNewAgent } from '../constants';

// --- ICONS --- //
const PlusIcon = (props: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${props.className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);
const GripVerticalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6h.01M14 6h.01M10 12h.01M14 12h.01M10 18h.01M14 18h.01" />
    </svg>
);
const PlusCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const SubordinateIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

// --- AGENT ITEM COMPONENT (Used by all views) --- //
interface AgentItemProps {
    agent: Agent;
    isSelected: boolean;
    hasChildren?: boolean;
    onSelect: () => void;
    onRemove: () => void;
    onAddSubordinate?: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    isDraggable: boolean;
    canDelete: boolean;
}
const AgentItem: React.FC<AgentItemProps> = ({ agent, isSelected, onSelect, onRemove, onAddSubordinate, onDragStart, onDragOver, onDrop, isDraggable, canDelete }) => {
    return (
        <div
            draggable={isDraggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 transition-all relative ${isSelected ? 'bg-slate-700/80 border-emerald-500 shadow-lg shadow-emerald-900/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
        >
            <div className={`absolute left-0 top-0 h-full w-1 rounded-l-md transition-all ${isSelected ? 'bg-emerald-400' : 'bg-transparent'}`}></div>
            {isDraggable && <GripVerticalIcon />}
            <div className="flex-grow cursor-pointer pl-1" onClick={onSelect}>
                <span className="font-medium text-slate-200">{agent.name}</span>
            </div>
            {onAddSubordinate && (
                <button onClick={onAddSubordinate} className="text-slate-400 hover:text-emerald-400 p-1 rounded-full" aria-label={`Add subordinate to ${agent.name}`} title="Add Subordinate">
                    <SubordinateIcon />
                </button>
            )}
            {canDelete && (
                <button onClick={onRemove} className="text-slate-500 hover:text-red-400 p-1 rounded-full" aria-label={`Remove ${agent.name}`}>
                    <TrashIcon />
                </button>
            )}
        </div>
    );
};

// --- WORKFLOW VIEWS --- //
type SharedViewProps = Omit<WorkflowDesignerProps, 'workflowType' | 'setWorkflowType'> & {
    draggedAgentId: string | null;
    setDraggedAgentId: (id: string | null) => void;
};

const SequentialView: React.FC<SharedViewProps> = ({ agents, setAgents, selectedAgentId, setSelectedAgentId, draggedAgentId, setDraggedAgentId }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, agentId: string) => {
        setDraggedAgentId(agentId);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetAgentId: string) => {
        e.preventDefault();
        if (!draggedAgentId || draggedAgentId === targetAgentId) return setDraggedAgentId(null);
        
        const draggedIndex = agents.findIndex(a => a.id === draggedAgentId);
        const targetIndex = agents.findIndex(a => a.id === targetAgentId);
        const newAgents = [...agents];
        const [draggedItem] = newAgents.splice(draggedIndex, 1);
        newAgents.splice(targetIndex, 0, draggedItem);
        setAgents(newAgents);
        setDraggedAgentId(null);
    };
    
    const removeAgent = (idToRemove: string) => {
        setAgents(prev => {
            const newAgents = prev.filter(a => a.id !== idToRemove);
            if (selectedAgentId === idToRemove) setSelectedAgentId(newAgents[0]?.id || null);
            return newAgents;
        });
    };

    return (
        <div className="flex flex-col items-center">
            {agents.map((agent, index) => {
                const isSelected = selectedAgentId === agent.id;
                const isNextSelected = selectedAgentId === agents[index + 1]?.id;
                return (
                    <React.Fragment key={agent.id}>
                        <AgentItem
                            agent={agent}
                            isSelected={isSelected}
                            onSelect={() => setSelectedAgentId(agent.id)}
                            onRemove={() => removeAgent(agent.id)}
                            onDragStart={(e) => handleDragStart(e, agent.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, agent.id)}
                            isDraggable={true}
                            canDelete={agents.length > 1}
                        />
                        {index < agents.length - 1 && (
                            <div className="flex justify-center py-1 relative group w-full">
                                <div className={`h-8 w-px transition-all duration-300 ${isSelected || isNextSelected ? 'animated-line-active' : 'animated-line'}`} aria-hidden="true" />
                                <div className="absolute top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all cursor-not-allowed" title="Branching & Parallel steps coming soon!">
                                    <PlusCircleIcon />
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

interface AgentNode extends Agent { children: AgentNode[] }
const HierarchicalView: React.FC<SharedViewProps> = ({ agents, setAgents, selectedAgentId, setSelectedAgentId, draggedAgentId, setDraggedAgentId }) => {
    const agentTree = useMemo((): AgentNode[] => {
        const agentMap: Record<string, AgentNode> = {};
        agents.forEach(agent => agentMap[agent.id] = {...agent, children: []});
        const tree: AgentNode[] = [];
        agents.forEach(agent => {
            if (agent.parentId && agentMap[agent.parentId]) {
                agentMap[agent.parentId].children.push(agentMap[agent.id]);
            } else {
                tree.push(agentMap[agent.id]);
            }
        });
        return tree;
    }, [agents]);

    const addSubordinate = (parentId: string) => {
        const newAgent = createNewAgent(parentId);
        setAgents(prev => [...prev, newAgent]);
        setSelectedAgentId(newAgent.id);
    };

    const removeAgentAndChildren = (agentId: string) => {
        setAgents(prev => {
            const childrenIds = new Set<string>();
            const getChildren = (id: string) => {
                childrenIds.add(id);
                prev.filter(a => a.parentId === id).forEach(child => getChildren(child.id));
            };
            getChildren(agentId);
            const newAgents = prev.filter(a => !childrenIds.has(a.id));
            if (childrenIds.has(selectedAgentId || '')) {
                setSelectedAgentId(newAgents.find(a => a.parentId === null)?.id || newAgents[0]?.id || null);
            }
            return newAgents;
        });
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, agentId: string) => {
        setDraggedAgentId(agentId);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetAgentId: string) => {
        e.preventDefault();
        if (!draggedAgentId || draggedAgentId === targetAgentId) return setDraggedAgentId(null);
        
        let current = agents.find(a => a.id === targetAgentId);
        while(current) {
            if (current.parentId === draggedAgentId) return;
            current = agents.find(a => a.id === current?.parentId);
        }

        setAgents(prev => prev.map(a => a.id === draggedAgentId ? {...a, parentId: targetAgentId} : a));
        setDraggedAgentId(null);
    };
    
    const AgentNodeComponent: React.FC<{ node: AgentNode }> = ({ node }) => (
        <div className="node-wrapper">
            <AgentItem
                agent={node}
                isSelected={selectedAgentId === node.id}
                onSelect={() => setSelectedAgentId(node.id)}
                onRemove={() => removeAgentAndChildren(node.id)}
                onAddSubordinate={() => addSubordinate(node.id)}
                onDragStart={(e) => handleDragStart(e, node.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, node.id)}
                isDraggable={true}
                canDelete={agents.length > 1}
            />
            {node.children.length > 0 && (
                <div className="children-container">
                    <div className="space-y-2 py-2">
                        {node.children.map(child => <AgentNodeComponent key={child.id} node={child} />)}
                    </div>
                </div>
            )}
        </div>
    );
    
    return (
        <div className="hierarchical-view space-y-2">
            {agentTree.map(rootNode => (
                <div key={rootNode.id} className="root-node">
                     <AgentItem
                        agent={rootNode}
                        isSelected={selectedAgentId === rootNode.id}
                        onSelect={() => setSelectedAgentId(rootNode.id)}
                        onRemove={() => removeAgentAndChildren(rootNode.id)}
                        onAddSubordinate={() => addSubordinate(rootNode.id)}
                        onDragStart={(e) => handleDragStart(e, rootNode.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, rootNode.id)}
                        isDraggable={true}
                        canDelete={agents.length > 1}
                    />
                    {rootNode.children.length > 0 && (
                        <div className="children-container">
                             <div className="space-y-2 py-2">
                                {rootNode.children.map(child => <AgentNodeComponent key={child.id} node={child} />)}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


const CollaborativeView: React.FC<SharedViewProps> = ({ agents, setAgents, selectedAgentId, setSelectedAgentId }) => {
    const removeAgent = (idToRemove: string) => {
        setAgents(prev => {
            const newAgents = prev.filter(a => a.id !== idToRemove);
            if (selectedAgentId === idToRemove) setSelectedAgentId(newAgents[0]?.id || null);
            return newAgents;
        });
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map(agent => (
                 <AgentItem
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgentId === agent.id}
                    onSelect={() => setSelectedAgentId(agent.id)}
                    onRemove={() => removeAgent(agent.id)}
                    onDragStart={(e) => e.preventDefault()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    isDraggable={false}
                    canDelete={agents.length > 1}
                />
            ))}
        </div>
    )
};

// --- MAIN COMPONENT --- //
interface WorkflowDesignerProps {
    agents: Agent[];
    setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
    selectedAgentId: string | null;
    setSelectedAgentId: (id: string | null) => void;
    workflowType: WorkflowType;
    setWorkflowType: (type: WorkflowType) => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({ agents, setAgents, selectedAgentId, setSelectedAgentId, workflowType, setWorkflowType }) => {
    const [draggedAgentId, setDraggedAgentId] = useState<string | null>(null);

    const addAgent = (parentId: string | null = null) => {
        const newAgent = createNewAgent(parentId);
        setAgents(prev => [...prev, newAgent]);
        setSelectedAgentId(newAgent.id);
    };

    const handleWorkflowTypeChange = (type: WorkflowType) => {
        if(type !== workflowType) {
            // When switching to a non-hierarchical view, flatten the structure.
            if(type === 'Sequential' || type === 'Collaborative') {
                setAgents(prev => prev.map(a => ({...a, parentId: null})));
            }
            setWorkflowType(type);
        }
    };

    const sharedViewProps = { agents, setAgents, selectedAgentId, setSelectedAgentId, draggedAgentId, setDraggedAgentId };
    
    const workflowTypes: { id: WorkflowType, label: string }[] = [
        { id: 'Sequential', label: 'Sequential' },
        { id: 'Hierarchical', label: 'Hierarchical' },
        { id: 'Collaborative', label: 'Collaborative' }
    ];

    return (
        <Card>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-emerald-400">Workflow / Agent Architecture</h3>
                     <button onClick={() => addAgent(workflowType === 'Hierarchical' ? null : undefined)} className="flex items-center bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        <PlusIcon className="mr-2" /> Add Agent
                    </button>
                </div>

                <div className="bg-slate-900/50 border-b border-slate-700 flex items-center p-1 rounded-lg">
                    {workflowTypes.map(type => (
                        <button
                            key={type.id}
                            onClick={() => handleWorkflowTypeChange(type.id)}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${ workflowType === type.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                <div className="mt-2">
                    {workflowType === 'Sequential' && <SequentialView {...sharedViewProps} />}
                    {workflowType === 'Hierarchical' && <HierarchicalView {...sharedViewProps} />}
                    {workflowType === 'Collaborative' && <CollaborativeView {...sharedViewProps} />}
                    {agents.length === 0 && <p className="text-center text-slate-500 py-4">No agents in the workflow. Click "Add Agent" to begin.</p>}
                </div>
            </div>
        </Card>
    );
};