import React from 'react';
import { Agent } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Textarea } from './common/Textarea';

interface ChainlitConfigProps {
    agent: Agent;
    updateAgent: (key: keyof Agent, value: Agent[keyof Agent]) => void;
}

export const ChainlitConfig: React.FC<ChainlitConfigProps> = ({ agent, updateAgent }) => {
    return (
        <Card>
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-emerald-400">Chainlit UI Settings (for first agent)</h3>
                <Textarea
                    label="Welcome Message"
                    id="welcomeMessage"
                    rows={2}
                    value={agent.welcome_message}
                    onChange={(e) => updateAgent('welcome_message', e.target.value)}
                    placeholder="The first message the user sees..."
                />
                <Input
                    label="Chat Input Placeholder"
                    id="inputPlaceholder"
                    value={agent.input_placeholder}
                    onChange={(e) => updateAgent('input_placeholder', e.target.value)}
                    placeholder="e.g., 'Ask about our products...'"
                />
            </div>
        </Card>
    );
};