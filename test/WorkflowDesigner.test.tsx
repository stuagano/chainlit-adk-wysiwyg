import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WorkflowDesigner } from '../components/WorkflowDesigner';
import { Agent, WorkflowType } from '../types';

describe('WorkflowDesigner Component', () => {
  let mockAgents: Agent[];
  let mockSetAgents: ReturnType<typeof vi.fn>;
  let mockSetSelectedAgentId: ReturnType<typeof vi.fn>;
  let mockSetWorkflowType: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAgents = [
      {
        id: '1',
        name: 'Agent 1',
        system_prompt: 'Test prompt 1',
        llmModel: 'gemini-1.5-flash',
        temperature: 0.7,
        tools: [],
        welcome_message: 'Welcome',
        input_placeholder: 'Type here',
        parentId: null,
      },
      {
        id: '2',
        name: 'Agent 2',
        system_prompt: 'Test prompt 2',
        llmModel: 'gemini-1.5-flash',
        temperature: 0.7,
        tools: [],
        welcome_message: 'Welcome',
        input_placeholder: 'Type here',
        parentId: null,
      },
    ];

    mockSetAgents = vi.fn();
    mockSetSelectedAgentId = vi.fn();
    mockSetWorkflowType = vi.fn();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={mockAgents[0].id}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      expect(screen.getByText(/Workflow \/ Agent Architecture/i)).toBeInTheDocument();
    });

    it('renders Add Agent button', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      expect(screen.getByText(/Add Agent/i)).toBeInTheDocument();
    });

    it('renders all workflow type buttons', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      expect(screen.getByText('Sequential')).toBeInTheDocument();
      expect(screen.getByText('Hierarchical')).toBeInTheDocument();
      expect(screen.getByText('Collaborative')).toBeInTheDocument();
    });

    it('displays all agents in the workflow', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      expect(screen.getByText('Agent 1')).toBeInTheDocument();
      expect(screen.getByText('Agent 2')).toBeInTheDocument();
    });

    it('displays message when no agents exist', () => {
      render(
        <WorkflowDesigner
          agents={[]}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      expect(screen.getByText(/No agents in the workflow/i)).toBeInTheDocument();
    });
  });

  describe('Workflow Type Switching', () => {
    it('highlights the current workflow type', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const sequentialButton = screen.getByText('Sequential');
      expect(sequentialButton).toHaveClass('bg-emerald-600');
    });

    it('calls setWorkflowType when clicking a different workflow type', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const hierarchicalButton = screen.getByText('Hierarchical');
      fireEvent.click(hierarchicalButton);

      expect(mockSetWorkflowType).toHaveBeenCalledWith('Hierarchical');
    });

    it('does not call setWorkflowType when clicking the current type', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const sequentialButton = screen.getByText('Sequential');
      fireEvent.click(sequentialButton);

      expect(mockSetWorkflowType).not.toHaveBeenCalled();
    });

    it('flattens agent structure when switching from Hierarchical to Sequential', () => {
      const hierarchicalAgents = [
        { ...mockAgents[0], parentId: null },
        { ...mockAgents[1], parentId: '1' }, // Child of Agent 1
      ];

      render(
        <WorkflowDesigner
          agents={hierarchicalAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Hierarchical"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const sequentialButton = screen.getByText('Sequential');
      fireEvent.click(sequentialButton);

      expect(mockSetAgents).toHaveBeenCalled();
      const setAgentsCall = mockSetAgents.mock.calls[0][0];
      const newAgents = typeof setAgentsCall === 'function'
        ? setAgentsCall(hierarchicalAgents)
        : setAgentsCall;

      // All agents should have null parentId
      expect(newAgents.every((agent: Agent) => agent.parentId === null)).toBe(true);
    });

    it('flattens agent structure when switching from Hierarchical to Collaborative', () => {
      const hierarchicalAgents = [
        { ...mockAgents[0], parentId: null },
        { ...mockAgents[1], parentId: '1' },
      ];

      render(
        <WorkflowDesigner
          agents={hierarchicalAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Hierarchical"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const collaborativeButton = screen.getByText('Collaborative');
      fireEvent.click(collaborativeButton);

      expect(mockSetAgents).toHaveBeenCalled();
      const setAgentsCall = mockSetAgents.mock.calls[0][0];
      const newAgents = typeof setAgentsCall === 'function'
        ? setAgentsCall(hierarchicalAgents)
        : setAgentsCall;

      expect(newAgents.every((agent: Agent) => agent.parentId === null)).toBe(true);
    });
  });

  describe('Agent Selection', () => {
    it('calls setSelectedAgentId when clicking an agent', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const agent1 = screen.getByText('Agent 1');
      fireEvent.click(agent1);

      expect(mockSetSelectedAgentId).toHaveBeenCalledWith('1');
    });

    it('visually highlights the selected agent', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId="1"
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      // Find the agent container by looking for the element with border classes
      const agent1Text = screen.getByText('Agent 1');
      const agent1Container = agent1Text.parentElement?.parentElement;
      expect(agent1Container).toHaveClass('border-emerald-500');
    });
  });

  describe('Add Agent Functionality', () => {
    it('calls setAgents when Add Agent button is clicked', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const addButton = screen.getByText(/Add Agent/i);
      fireEvent.click(addButton);

      expect(mockSetAgents).toHaveBeenCalled();
    });

    it('adds a new agent to the array', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const addButton = screen.getByText(/Add Agent/i);
      fireEvent.click(addButton);

      const setAgentsCall = mockSetAgents.mock.calls[0][0];
      const newAgents = typeof setAgentsCall === 'function'
        ? setAgentsCall(mockAgents)
        : setAgentsCall;

      expect(newAgents.length).toBe(mockAgents.length + 1);
    });

    it('selects the newly added agent', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const addButton = screen.getByText(/Add Agent/i);
      fireEvent.click(addButton);

      expect(mockSetSelectedAgentId).toHaveBeenCalled();
    });
  });

  describe('Remove Agent Functionality - Sequential View', () => {
    it('shows delete buttons for agents when more than one exists', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      // Should have delete buttons (aria-label includes "Remove")
      const deleteButtons = screen.getAllByLabelText(/Remove/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('hides delete button when only one agent exists', () => {
      render(
        <WorkflowDesigner
          agents={[mockAgents[0]]}
          setAgents={mockSetAgents}
          selectedAgentId={mockAgents[0].id}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const deleteButtons = screen.queryAllByLabelText(/Remove/i);
      expect(deleteButtons.length).toBe(0);
    });

    it('calls setAgents when delete button is clicked', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/Remove/i);
      fireEvent.click(deleteButtons[0]);

      expect(mockSetAgents).toHaveBeenCalled();
    });

    it('removes the agent from the array', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Sequential"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/Remove/i);
      fireEvent.click(deleteButtons[0]);

      const setAgentsCall = mockSetAgents.mock.calls[0][0];
      const newAgents = typeof setAgentsCall === 'function'
        ? setAgentsCall(mockAgents)
        : setAgentsCall;

      expect(newAgents.length).toBe(mockAgents.length - 1);
      expect(newAgents.find((a: Agent) => a.id === '1')).toBeUndefined();
    });
  });

  describe('Hierarchical View - Subordinate Management', () => {
    it('shows add subordinate buttons in hierarchical view', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Hierarchical"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      // Look for subordinate add buttons (aria-label includes "Add subordinate")
      const subordinateButtons = screen.getAllByLabelText(/Add subordinate/i);
      expect(subordinateButtons.length).toBeGreaterThan(0);
    });

    it('adds a subordinate when button is clicked', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Hierarchical"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const subordinateButtons = screen.getAllByLabelText(/Add subordinate/i);
      fireEvent.click(subordinateButtons[0]);

      expect(mockSetAgents).toHaveBeenCalled();
      const setAgentsCall = mockSetAgents.mock.calls[0][0];
      const newAgents = typeof setAgentsCall === 'function'
        ? setAgentsCall(mockAgents)
        : setAgentsCall;

      // Should have added one more agent
      expect(newAgents.length).toBe(mockAgents.length + 1);
    });

    it('new subordinate has correct parentId', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Hierarchical"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const subordinateButtons = screen.getAllByLabelText(/Add subordinate/i);
      fireEvent.click(subordinateButtons[0]); // Add subordinate to first agent

      const setAgentsCall = mockSetAgents.mock.calls[0][0];
      const newAgents = typeof setAgentsCall === 'function'
        ? setAgentsCall(mockAgents)
        : setAgentsCall;

      const newAgent = newAgents[newAgents.length - 1];
      expect(newAgent.parentId).toBe('1'); // Parent should be first agent
    });
  });

  describe('Collaborative View', () => {
    it('renders all agents in collaborative view', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Collaborative"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      expect(screen.getByText('Agent 1')).toBeInTheDocument();
      expect(screen.getByText('Agent 2')).toBeInTheDocument();
    });

    it('shows delete buttons for agents in collaborative view', () => {
      render(
        <WorkflowDesigner
          agents={mockAgents}
          setAgents={mockSetAgents}
          selectedAgentId={null}
          setSelectedAgentId={mockSetSelectedAgentId}
          workflowType="Collaborative"
          setWorkflowType={mockSetWorkflowType}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/Remove/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });
});
