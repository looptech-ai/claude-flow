---
name: swarm-orchestration
description: Simple orchestration patterns for claude-flow swarms. Shows menu of CLI patterns and instructs primary to spawn clerk/observer for monitoring.
auto_invoke: true
triggers:
  - "orchestrate"
  - "start swarm"
  - "build with swarm"
  - "create swarm"
---

# Swarm Orchestration - Simple Patterns

## When to Use

When the user wants to build something with a claude-flow swarm, show them the pattern menu.

## Pattern Menu

```
┌───────────────────────────────────────────────────┐
│ Claude-Flow Orchestration Patterns                │
├───────────────────────────────────────────────────┤
│ 1. Quick Swarm (Simple tasks, 2-5 min)           │
│    claude-flow swarm "task description"           │
│                                                   │
│ 2. Hive-Mind (Complex, persistent)               │
│    claude-flow hive-mind spawn "project goal"    │
│                                                   │
│ 3. Background (Long-running)                     │
│    claude-flow swarm "task" --background         │
│                                                   │
│ 4. SPARC TDD (Test-driven development)           │
│    claude-flow sparc tdd "feature"               │
└───────────────────────────────────────────────────┘
```

## Simple 4-Step Workflow

### Step 1: Run CLI Command

Execute the chosen pattern:

```bash
# Example: Quick swarm
claude-flow swarm "Build REST API with authentication"

# Example: Background
claude-flow swarm "Generate docs" --background > swarm.log 2>&1 &
```

### Step 2: Spawn Clerk Observer

After starting the swarm, spawn the monitoring agent:

```javascript
Task("Swarm Observer", `
Monitor the running swarm and report status.

Check MCP tools every 30 seconds:
- mcp__claude-flow__swarm_status()
- mcp__claude-flow__agent_list()
- mcp__claude-flow__task_status()

Report:
- Agent count and status
- Task progress
- Files being created
- Any errors

Keep monitoring until complete.
`, "clerk")
```

### Step 3: Monitor Alongside

While clerk observes, you also check status:

```javascript
// Periodic status checks
mcp__claude-flow__swarm_status()
mcp__claude-flow__agent_list()
mcp__claude-flow__performance_report()
```

### Step 4: Review Results

When complete:
- Read generated files
- Validate against requirements
- Report to user

## That's It!

**Simple**: CLI starts work → Clerk watches → You coordinate → Review results

**No complexity**: Just pick a pattern, start swarm, spawn clerk, monitor with MCP tools.
