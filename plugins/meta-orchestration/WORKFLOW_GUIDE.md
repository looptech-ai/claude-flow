# Swarm Orchestration Workflow Guide

> **CRITICAL**: After spawning agents, you MUST delegate work to them. Do not fall back to direct tool usage.

## The Golden Rule

**If you spawn agents, you are now an ORCHESTRATOR, not a WORKER.**

Your role changes from:
- ❌ Directly solving problems with Edit/Write/Bash
- ✅ Delegating tasks and monitoring agent work

## Complete Workflow Cycle

### Phase 1: Initialize Swarm

```javascript
// 1. Initialize with topology
mcp__claude-flow__swarm_init({
  topology: "hierarchical",  // or mesh, ring, star
  maxAgents: 5
})

// 2. Spawn specialized agents
mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "coordinator", name: "Lead" },
    { type: "coder", name: "Developer" },
    { type: "reviewer", name: "QA" }
  ]
})

// 3. ⚠️ STOP HERE - Do NOT use direct tools yet!
```

### Phase 2: Delegate Tasks (REQUIRED)

```javascript
// Orchestrate work to agents
mcp__claude-flow__task_orchestrate({
  task: "Implement Docker caching in CI/CD pipeline",
  strategy: "parallel",  // or sequential, adaptive
  priority: "high"
})

// Returns: { taskId: "task_123..." }
```

### Phase 3: Monitor Progress (REQUIRED)

```javascript
// Check task status (repeat until complete)
mcp__claude-flow__task_status({
  taskId: "task_123..."
})

// Returns:
// { status: "pending" | "in_progress" | "completed" | "failed" }
```

### Phase 4: Wait for Completion

**CRITICAL**: Do not move forward until task is "completed" or "failed"

```javascript
// Keep checking until done
while (status !== "completed") {
  // Wait 10-15 seconds
  mcp__claude-flow__task_status({ taskId: "task_123..." })
}
```

### Phase 5: Retrieve Results (REQUIRED)

```javascript
// Get the actual work done by agents
mcp__claude-flow__task_results({
  taskId: "task_123..."
})

// Returns: { results: [...agent outputs...] }
```

### Phase 6: Review and Act

```javascript
// Now you can review what agents produced
// If good: Accept and merge
// If needs changes: Orchestrate follow-up tasks
// DO NOT directly fix issues - delegate to agents!
```

## Common Mistakes

### ❌ Mistake 1: Spawn then immediately work directly

```javascript
// WRONG:
mcp__claude-flow__agents_spawn_parallel({ agents: [...] })
Edit("file.ts", "old", "new")  // ❌ Bypassing the agents!
```

```javascript
// RIGHT:
mcp__claude-flow__agents_spawn_parallel({ agents: [...] })
mcp__claude-flow__task_orchestrate({
  task: "Fix the bug in file.ts"
})
```

### ❌ Mistake 2: Not waiting for completion

```javascript
// WRONG:
task_orchestrate({ task: "..." })
task_status({ taskId: "..." })  // Immediately check
// Status: "pending" - not done yet!
// Move on anyway ❌
```

```javascript
// RIGHT:
const { taskId } = task_orchestrate({ task: "..." })
// Wait 10-15 seconds
const { status } = task_status({ taskId })
if (status !== "completed") {
  // Keep waiting!
}
```

### ❌ Mistake 3: Not retrieving results

```javascript
// WRONG:
task_orchestrate({ task: "..." })
task_status({ taskId: "..." })  // Shows "completed"
// Never call task_results() ❌
// Don't know what agents actually did!
```

```javascript
// RIGHT:
task_orchestrate({ task: "..." })
// Wait for completion...
task_results({ taskId: "..." })  // Get actual outputs
// Review what agents produced
```

## Forcing Functions

### Self-Check Before Direct Tools

Before using Edit, Write, Bash, or other direct tools, ask:

1. **Have I spawned agents?**
   - If YES: Do NOT use direct tools. Use task_orchestrate instead.

2. **Am I orchestrating or working?**
   - Orchestrating = Delegating to agents ✅
   - Working = Direct implementation ❌ (when agents exist)

3. **Have I retrieved task results?**
   - If NO: You don't know what agents did. Retrieve first.

### Pattern Enforcement

```javascript
// Establish this pattern after spawning:
function delegateAndWait(task) {
  // 1. Delegate
  const { taskId } = task_orchestrate({ task })

  // 2. Monitor
  let status = "pending"
  while (status !== "completed" && status !== "failed") {
    // Wait 10 seconds
    status = task_status({ taskId }).status
  }

  // 3. Retrieve
  const results = task_results({ taskId })

  // 4. Return for review
  return results
}

// Use this for EVERY task
const results = delegateAndWait("Implement feature X")
// Review results before proceeding
```

## Troubleshooting

### Swarm Status Shows 0 Agents

**Problem**: `swarm_status()` returns `{ agentCount: 0 }`

**Causes**:
1. Agents spawned in different swarm session
2. Swarm initialization failed
3. Agents crashed or were terminated

**Solution**:
```javascript
// Verify swarm is active
swarm_status()  // Should show agents

// If 0 agents, reinitialize
swarm_init({ topology: "hierarchical", maxAgents: 5 })
agents_spawn_parallel({ agents: [...] })
```

### Tasks Not Appearing

**Problem**: `task_status()` shows task doesn't exist

**Causes**:
1. Task ID not captured from orchestrate call
2. Task orchestration failed
3. Wrong swarm session

**Solution**:
```javascript
// Always capture task ID
const response = task_orchestrate({ task: "..." })
console.log("Task ID:", response.taskId)  // Verify it exists

// Use exact task ID in status checks
task_status({ taskId: response.taskId })
```

### No Results Available

**Problem**: `task_results()` returns empty or null

**Causes**:
1. Task not completed yet
2. Task failed
3. Agents produced no output

**Solution**:
```javascript
// Check status first
const { status } = task_status({ taskId: "..." })

if (status === "failed") {
  // Check swarm_status() for errors
  // Re-orchestrate with different approach
}

if (status === "in_progress") {
  // Wait longer, then check again
}

if (status === "completed") {
  // Now safe to retrieve
  const results = task_results({ taskId: "..." })
}
```

## Best Practices

### 1. Always Use Parallel Spawning

```javascript
// ✅ GOOD: Spawn all at once
agents_spawn_parallel({
  agents: [
    { type: "coordinator", name: "Lead" },
    { type: "coder", name: "Dev1" },
    { type: "coder", name: "Dev2" },
    { type: "tester", name: "QA" }
  ]
})
```

### 2. Match Agent Types to Tasks

```javascript
// Coordinator for planning
task_orchestrate({
  task: "Create implementation plan",
  assignTo: "coordinator"
})

// Coder for implementation
task_orchestrate({
  task: "Implement feature based on plan",
  assignTo: "coder"
})

// Tester for validation
task_orchestrate({
  task: "Test implemented feature",
  assignTo: "tester"
})
```

### 3. Use Sequential Strategy for Dependencies

```javascript
// Tasks that depend on each other
task_orchestrate({
  task: "1. Plan, 2. Implement, 3. Test",
  strategy: "sequential"  // Forces order
})
```

### 4. Monitor Swarm Health

```javascript
// Regular health checks
const health = swarm_status()
console.log(`Active: ${health.activeAgents}/${health.agentCount}`)

if (health.activeAgents < health.agentCount) {
  // Some agents are down - investigate
}
```

## Real Example: Full Workflow

```javascript
// COMPLETE EXAMPLE: CI/CD Pipeline Updates

// 1. Initialize
swarm_init({ topology: "hierarchical", maxAgents: 4 })

// 2. Spawn agents
agents_spawn_parallel({
  agents: [
    { type: "coordinator", name: "Lead" },
    { type: "coder", name: "DevOps" },
    { type: "reviewer", name: "QA" }
  ]
})

// 3. Delegate planning
const planTask = task_orchestrate({
  task: "Create plan for adding Docker caching to CI/CD",
  strategy: "sequential"
})

// 4. Wait for plan
let planStatus = "pending"
while (planStatus !== "completed") {
  await new Promise(r => setTimeout(r, 10000))  // Wait 10s
  planStatus = task_status({ taskId: planTask.taskId }).status
}

// 5. Get plan results
const plan = task_results({ taskId: planTask.taskId })
console.log("Plan:", plan.results)

// 6. Delegate implementation
const implTask = task_orchestrate({
  task: "Implement the Docker caching plan",
  strategy: "parallel"
})

// 7. Wait for implementation
let implStatus = "pending"
while (implStatus !== "completed") {
  await new Promise(r => setTimeout(r, 15000))  // Wait 15s
  implStatus = task_status({ taskId: implTask.taskId }).status
}

// 8. Get implementation results
const impl = task_results({ taskId: implTask.taskId })

// 9. Delegate review
const reviewTask = task_orchestrate({
  task: "Review Docker caching implementation for best practices",
  strategy: "sequential"
})

// 10. Wait and retrieve review
// ... same pattern ...

// 11. Act on results
// If review passed: merge
// If review found issues: orchestrate fixes (do NOT fix directly!)
```

## Summary Checklist

After spawning agents, follow this checklist:

- [ ] Initialized swarm with topology
- [ ] Spawned all required agents
- [ ] Used task_orchestrate (NOT direct tools)
- [ ] Captured task ID
- [ ] Monitored with task_status until completed
- [ ] Retrieved results with task_results
- [ ] Reviewed agent outputs
- [ ] Delegated follow-up work (if needed)
- [ ] Did NOT use Edit/Write/Bash directly

**If any checkbox is unchecked, you're not using the swarm correctly!**

---

**Remember**: You are an ORCHESTRATOR, not a WORKER. Conduct the symphony, don't play all the instruments yourself! 🎵
