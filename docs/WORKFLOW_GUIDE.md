# Multi-Agent Workflow Types - Complete Guide

This guide explains all three workflow types supported by the ADK & Chainlit Agent Builder, with examples and use cases for each.

## Table of Contents

- [Overview](#overview)
- [Sequential Workflow](#sequential-workflow)
- [Hierarchical Workflow](#hierarchical-workflow)
- [Collaborative Workflow](#collaborative-workflow)
- [Choosing the Right Workflow](#choosing-the-right-workflow)
- [Testing Each Workflow](#testing-each-workflow)

---

## Overview

The Agent Builder supports three distinct multi-agent architectures, each optimized for different use cases:

| Workflow Type | Best For | Agent Flow | Complexity |
|--------------|----------|------------|------------|
| **Sequential** | Linear processes, pipelines | Agent 1 → Agent 2 → Agent 3 | Simple |
| **Hierarchical** | Task delegation, specialization | Supervisor → Workers | Medium |
| **Collaborative** | Team problem-solving | All agents work together | Advanced |

---

## Sequential Workflow

### 🎯 What It Does

Agents process requests **in order**, like an assembly line. Each agent receives the output of the previous agent.

### 📊 Flow Diagram

```
User Input
    ↓
Agent 1 (processes input)
    ↓
Agent 2 (processes Agent 1's output)
    ↓
Agent 3 (processes Agent 2's output)
    ↓
Final Output to User
```

### ✅ When to Use

- **Data transformation pipelines**: Raw data → Clean → Analyze → Report
- **Multi-step processing**: Draft → Review → Finalize
- **Progressive refinement**: Research → Summarize → Format
- **Quality control**: Generate → Validate → Improve

### 🔧 Configuration in UI

1. Set Workflow Type to **"Sequential"**
2. Add agents in the order you want them to execute
3. Each agent sees the previous agent's output
4. Use drag-and-drop to reorder agents

### 💡 Example Use Case: Content Creation Pipeline

**Agent 1 - Researcher**:
- **System Prompt**: "Research the topic thoroughly. Provide factual information with sources."
- **Tools**: `web_search`, `get_articles`
- **LLM**: Gemini 1.5 Flash (fast research)

**Agent 2 - Writer**:
- **System Prompt**: "Take the research and write an engaging article. Use clear, professional language."
- **Tools**: None (just writes)
- **LLM**: GPT-4o (better writing)

**Agent 3 - Editor**:
- **System Prompt**: "Review and improve the article. Fix grammar, improve flow, suggest enhancements."
- **Tools**: `grammar_check`, `style_guide`
- **LLM**: Gemini 1.5 Pro (thorough review)

**Flow**:
```
User: "Write an article about quantum computing"
  ↓
Researcher: [Gathers facts, papers, recent news]
  ↓
Writer: [Creates 800-word article from research]
  ↓
Editor: [Polishes, improves, finalizes]
  ↓
User receives: Polished, well-researched article
```

### 📝 Generated Code Structure

```python
# Sequential workflow setup
workflow = Sequential(
    agents=[
        agent_1,  # Researcher
        agent_2,  # Writer
        agent_3   # Editor
    ]
)
```

**How it executes**:
1. User message goes to Agent 1
2. Agent 1's response goes to Agent 2 as input
3. Agent 2's response goes to Agent 3 as input
4. Agent 3's response goes back to user

---

## Hierarchical Workflow

### 🎯 What It Does

A **supervisor agent** delegates tasks to **worker agents** based on the request. The supervisor coordinates and combines worker outputs.

### 📊 Flow Diagram

```
                User Input
                    ↓
            Supervisor Agent
           /        |        \
          ↓         ↓         ↓
    Worker 1   Worker 2   Worker 3
    (Sales)    (Support)  (Technical)
          \        |        /
           \       ↓       /
            Supervisor
         (Combines results)
                ↓
          Final Output
```

### ✅ When to Use

- **Task delegation**: Route to specialist agents
- **Parallel processing**: Multiple agents work simultaneously
- **Expert systems**: Different agents for different domains
- **Load distribution**: Supervisor assigns work based on capacity

### 🔧 Configuration in UI

1. Set Workflow Type to **"Hierarchical"**
2. Add the **supervisor agent** first
3. Add **worker agents**
4. Click "Add Subordinate" button on supervisor to create workers
5. Workers automatically link to their parent

### 💡 Example Use Case: Customer Service System

**Supervisor - Customer Service Manager**:
- **System Prompt**: "You coordinate customer requests. Analyze the request and delegate to the appropriate specialist. Combine their responses into a helpful answer."
- **Tools**: `categorize_request`, `priority_check`
- **LLM**: Gemini 1.5 Pro (smart routing)

**Worker 1 - Technical Support**:
- **Parent**: Supervisor
- **System Prompt**: "You handle technical questions. Provide step-by-step solutions."
- **Tools**: `check_system_status`, `troubleshoot`
- **LLM**: Gemini 1.5 Flash

**Worker 2 - Billing Specialist**:
- **Parent**: Supervisor
- **System Prompt**: "You handle billing and payment questions. Be precise about costs."
- **Tools**: `check_invoice`, `payment_status`
- **LLM**: Gemini 1.5 Flash

**Worker 3 - Product Expert**:
- **Parent**: Supervisor
- **System Prompt**: "You explain product features and recommend solutions."
- **Tools**: `product_catalog`, `feature_lookup`
- **LLM**: Gemini 1.5 Flash

**Flow Example 1** (Technical Question):
```
User: "My software won't start, error code 404"
  ↓
Supervisor: [Categorizes as technical issue]
  ↓
Technical Support: [Provides troubleshooting steps]
  ↓
Supervisor: [Formats and delivers solution]
  ↓
User receives: Step-by-step fix
```

**Flow Example 2** (Complex Question):
```
User: "Can I upgrade my plan and what's the cost?"
  ↓
Supervisor: [Needs both product info and billing]
  ↓
Product Expert: [Lists plan features]
Billing Specialist: [Provides pricing]
  ↓
Supervisor: [Combines both answers]
  ↓
User receives: Complete upgrade information
```

### 📝 Generated Code Structure

```python
# Hierarchical workflow setup
workflow = Hierarchical(
    agents=[supervisor, worker_1, worker_2, worker_3],
    structure={
        supervisor: [worker_1, worker_2, worker_3]
    }
)
```

**How it executes**:
1. User message goes to Supervisor
2. Supervisor decides which worker(s) to use
3. Worker(s) process their tasks
4. Supervisor combines results
5. Combined response goes to user

---

## Collaborative Workflow

### 🎯 What It Does

All agents work **together as a team**. They can see each other's outputs and build on each other's ideas in real-time.

### 📊 Flow Diagram

```
                User Input
                    ↓
        ┌───────────┴───────────┐
        ↓           ↓           ↓
    Agent 1     Agent 2     Agent 3
   (Analyst)   (Creative)  (Critic)
        ↓           ↓           ↓
    All agents see all outputs
    ┌───────┴──────┴───────┐
    ↓       ↓       ↓       ↓
Iterate, refine, build consensus
                ↓
          Final Output
```

### ✅ When to Use

- **Brainstorming**: Multiple perspectives needed
- **Consensus building**: Agents debate and agree
- **Multi-expertise problems**: Requires diverse skills
- **Quality through iteration**: Agents critique and improve

### 🔧 Configuration in UI

1. Set Workflow Type to **"Collaborative"**
2. Add all agents (they're all peers)
3. Agents can see and respond to each other
4. Order matters less (they all collaborate)

### 💡 Example Use Case: Strategic Planning Team

**Agent 1 - Data Analyst**:
- **System Prompt**: "You provide data-driven insights. Always back up claims with numbers."
- **Tools**: `analyze_data`, `create_chart`, `statistical_test`
- **LLM**: Gemini 1.5 Pro (analytical)

**Agent 2 - Creative Strategist**:
- **System Prompt**: "You propose innovative solutions. Think outside the box."
- **Tools**: `research_trends`, `competitor_analysis`
- **LLM**: GPT-4o (creative thinking)

**Agent 3 - Risk Assessor**:
- **System Prompt**: "You identify potential risks and challenges. Be thorough and cautious."
- **Tools**: `risk_analysis`, `scenario_planning`
- **LLM**: Gemini 1.5 Pro (careful analysis)

**Agent 4 - Implementation Expert**:
- **System Prompt**: "You evaluate feasibility and create action plans. Be practical."
- **Tools**: `resource_calculator`, `timeline_builder`
- **LLM**: Gemini 1.5 Flash (practical)

**Flow**:
```
User: "Should we expand to the European market?"
  ↓
Data Analyst: "Market data shows 40% growth opportunity, €2M potential revenue"
Creative Strategist: "Innovative entry strategy: partner with local influencers"
Risk Assessor: "Currency risk, regulatory compliance issues identified"
Implementation Expert: "Feasible in 6 months, needs €500K investment"
  ↓
Agents iterate and refine based on each other's input
  ↓
User receives: Comprehensive strategic recommendation
```

### 📝 Generated Code Structure

```python
# Collaborative workflow setup
workflow = Collaborative(
    agents=[
        agent_1,  # Data Analyst
        agent_2,  # Creative Strategist
        agent_3,  # Risk Assessor
        agent_4   # Implementation Expert
    ]
)
```

**How it executes**:
1. User message visible to all agents
2. Each agent can contribute
3. Agents see each other's responses
4. They can build on, critique, or refine ideas
5. Consensus or combined output returns to user

---

## Choosing the Right Workflow

### Decision Tree

```
Start
 │
 ├─ Need step-by-step processing?
 │  └─ Yes → SEQUENTIAL
 │      (each step depends on previous)
 │
 ├─ Need task delegation to specialists?
 │  └─ Yes → HIERARCHICAL
 │      (supervisor routes to experts)
 │
 └─ Need team collaboration?
    └─ Yes → COLLABORATIVE
        (all work together)
```

### Comparison Table

| Feature | Sequential | Hierarchical | Collaborative |
|---------|-----------|--------------|---------------|
| **Agent Communication** | One-way chain | Parent-child only | All-to-all |
| **Execution Order** | Fixed | Supervisor decides | Dynamic |
| **Best for Complexity** | Medium | Medium-High | High |
| **Response Time** | Slower (sequential) | Fast (parallel) | Moderate |
| **Coordination** | Automatic | Supervisor | Self-organizing |
| **Typical Agent Count** | 2-5 | 3-7 (1 super + workers) | 3-6 peers |

### Use Case Matrix

| Your Need | Recommended Workflow |
|-----------|---------------------|
| Document review pipeline | Sequential |
| Customer support routing | Hierarchical |
| Strategic decision making | Collaborative |
| Data processing ETL | Sequential |
| Multi-department requests | Hierarchical |
| Creative brainstorming | Collaborative |
| Quality assurance chain | Sequential |
| Specialized task routing | Hierarchical |
| Expert panel review | Collaborative |

---

## Testing Each Workflow

### Quick Test Checklist

For each workflow you create:

1. ✅ **Configure** agents in the UI
2. ✅ **Generate Code** (check for errors)
3. ✅ **Preview Syntax** (review generated Python)
4. ✅ **Sync to Chainlit** (automatic launch)
5. ✅ **Test in Browser** (try different prompts)
6. ✅ **Verify Behavior** (agents work as expected)

### Test Prompts by Workflow

**Sequential Test**:
```
Try: "Process this through all stages: [your input]"
Expect: Each agent adds to the previous output
```

**Hierarchical Test**:
```
Try different categories:
- "Technical question: ..."
- "Billing question: ..."
- "General question: ..."
Expect: Supervisor routes to correct specialist
```

**Collaborative Test**:
```
Try: "What do you all think about [complex topic]?"
Expect: Multiple perspectives, agents reference each other
```

### Common Issues and Fixes

#### Sequential: Agents don't pass context
- **Fix**: Check system prompts don't ignore input
- **Fix**: Ensure agents use conversation history

#### Hierarchical: Supervisor doesn't delegate
- **Fix**: Improve supervisor's system prompt with delegation instructions
- **Fix**: Add tools to help categorize requests

#### Collaborative: Agents repeat each other
- **Fix**: Make system prompts more distinct
- **Fix**: Instruct agents to build on (not repeat) others' ideas

---

## Example Configurations

### Example 1: Blog Writing (Sequential)

```
Agent 1: Outline Creator
- "Create a detailed outline for the topic"
- Tools: research_topic

Agent 2: Draft Writer
- "Write engaging content following the outline"
- Tools: None

Agent 3: SEO Optimizer
- "Optimize for search engines while maintaining quality"
- Tools: keyword_analyzer, meta_generator
```

### Example 2: IT Help Desk (Hierarchical)

```
Supervisor: IT Coordinator
- "Route requests to the right specialist"
- Tools: categorize_issue, priority_check

Worker 1: Hardware Support
- "Fix hardware problems"
- Tools: hardware_diagnostics

Worker 2: Software Support
- "Resolve software issues"
- Tools: software_troubleshoot

Worker 3: Network Support
- "Handle network connectivity"
- Tools: network_diagnostic
```

### Example 3: Investment Advisory (Collaborative)

```
Agent 1: Market Analyst
- "Analyze market trends and opportunities"
- Tools: market_data, chart_analysis

Agent 2: Risk Manager
- "Assess investment risks"
- Tools: risk_calculator, portfolio_analyzer

Agent 3: Financial Planner
- "Create personalized strategies"
- Tools: goal_planner, tax_calculator

All work together to provide comprehensive advice
```

---

## Generated Code Examples

### Sequential Workflow Code

```python
from adk.workflow import Sequential

# Agents execute in order
workflow = Sequential(
    agents=[researcher, writer, editor]
)

# User input flows through each agent
# User → Researcher → Writer → Editor → User
```

### Hierarchical Workflow Code

```python
from adk.workflow import Hierarchical

# Supervisor coordinates workers
workflow = Hierarchical(
    agents=[supervisor, tech_support, billing, sales],
    structure={
        supervisor: [tech_support, billing, sales]
    }
)

# Supervisor decides which workers to use
# User → Supervisor → [Worker(s)] → Supervisor → User
```

### Collaborative Workflow Code

```python
from adk.workflow import Collaborative

# All agents work as peers
workflow = Collaborative(
    agents=[analyst, strategist, critic, planner]
)

# All agents contribute and see each other's work
# User → [All Agents Collaborate] → User
```

---

## Next Steps

1. **Start Simple**: Try Sequential first
2. **Experiment**: Test different agent combinations
3. **Iterate**: Refine system prompts based on results
4. **Scale Up**: Try Hierarchical/Collaborative for complex needs

**Ready to build?** Open the UI at http://localhost:3000 and create your first multi-agent system!

---

**Need Help?**
- See [QUICKSTART.md](./QUICKSTART.md) for UI walkthrough
- See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for code details
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
