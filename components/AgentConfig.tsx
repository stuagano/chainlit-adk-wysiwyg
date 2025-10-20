import React from 'react';
import { Agent } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Textarea } from './common/Textarea';
import { AdvancedAgentConfig } from './AdvancedAgentConfig';

interface AgentConfigProps {
  agent: Agent;
  updateAgent: (key: keyof Agent, value: any) => void;
}

export const AgentConfig: React.FC<AgentConfigProps> = ({ agent, updateAgent }) => {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-emerald-400">Selected Agent Settings ({agent.name})</h3>
        <Input
          label="Agent Name"
          id="agentName"
          value={agent.name}
          onChange={(e) => updateAgent('name', e.target.value)}
          placeholder="e.g., SupportBot"
        />
        <Textarea
          label="System Prompt / Personality"
          id="systemPrompt"
          rows={4}
          value={agent.system_prompt}
          onChange={(e) => updateAgent('system_prompt', e.target.value)}
          placeholder="Define the agent's personality and instructions..."
        />
        <div className="border-t border-slate-700 -mx-6"></div>
        <AdvancedAgentConfig agent={agent} updateAgent={updateAgent} />
      </div>
    </Card>
  );
};