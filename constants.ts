import { Agent, GCPConfig } from './types';

export const initialAgentsState: Agent[] = [
  {
  id: crypto.randomUUID(),
  name: 'MyAssistant',
  system_prompt: 'You are a helpful and friendly assistant. When using tools, explain what you are doing.',
  welcome_message: 'Hello! I am your new assistant. How can I help you today?',
  input_placeholder: 'Ask me anything...',
  tools: [
    {
      id: 'd9b7c8e0-a1b2-4c3d-8e4f-5a6b7c8d9e0f',
      name: 'get_weather',
      description: 'Fetches the current weather for a specified location.',
      parameters: [
        {
          id: 'p1',
          name: 'location',
          type: 'string',
          description: 'The city and state, e.g., "San Francisco, CA"',
          required: true,
        },
        {
            id: 'p2',
            name: 'unit',
            type: 'string',
            description: 'The temperature unit, either "celsius" or "fahrenheit"',
            required: false,
        }
      ],
    },
  ],
  parentId: null,
}];

export const initialGCPState: GCPConfig = {
    projectId: '',
    serviceName: 'my-adk-agent',
    region: 'us-central1',
    serviceAccountKeyJson: '',
    serviceAccountKeyName: '',
};

export const createNewAgent = (parentId: string | null = null): Agent => ({
    id: crypto.randomUUID(),
    name: 'New Agent',
    system_prompt: 'You are a specialized assistant.',
    welcome_message: 'Hello! How can I assist you?',
    input_placeholder: 'Enter your query...',
    tools: [],
    parentId,
});