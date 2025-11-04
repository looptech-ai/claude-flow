---
name: "Swarm Orchestration"
description: "Orchestrate multi-agent swarms with agentic-flow for parallel task execution, dynamic topology, and intelligent coordination. Use when scaling beyond single agents, implementing complex workflows, or building distributed AI systems."
---

# Swarm Orchestration

## What This Skill Does

Orchestrates multi-agent swarms using agentic-flow's advanced coordination system. Supports mesh, hierarchical, and adaptive topologies with automatic task distribution, load balancing, and fault tolerance.

## Prerequisites

- agentic-flow v1.5.11+
- Node.js 18+
- Understanding of distributed systems (helpful)

## Quick Start

```bash
# Initialize swarm
npx agentic-flow hooks swarm-init --topology mesh --max-agents 5

# Spawn agents
npx agentic-flow hooks agent-spawn --type coder
npx agentic-flow hooks agent-spawn --type tester
npx agentic-flow hooks agent-spawn --type reviewer

# Orchestrate task
npx agentic-flow hooks task-orchestrate \
  --task "Build REST API with tests" \
  --mode parallel
```

## Topology Patterns

### 1. Mesh (Peer-to-Peer)
```typescript
// Equal peers, distributed decision-making
await swarm.init({
  topology: 'mesh',
  agents: ['coder', 'tester', 'reviewer'],
  communication: 'broadcast'
});
```

### 2. Hierarchical (Queen-Worker)
```typescript
// Centralized coordination, specialized workers
await swarm.init({
  topology: 'hierarchical',
  queen: 'architect',
  workers: ['backend-dev', 'frontend-dev', 'db-designer']
});
```

### 3. Adaptive (Dynamic)
```typescript
// Automatically switches topology based on task
await swarm.init({
  topology: 'adaptive',
  optimization: 'task-complexity'
});
```

## Task Orchestration

### Parallel Execution
```typescript
// Execute tasks concurrently
const results = await swarm.execute({
  tasks: [
    { agent: 'coder', task: 'Implement API endpoints' },
    { agent: 'frontend', task: 'Build UI components' },
    { agent: 'tester', task: 'Write test suite' }
  ],
  mode: 'parallel',
  timeout: 300000 // 5 minutes
});
```

### Pipeline Execution
```typescript
// Sequential pipeline with dependencies
await swarm.pipeline([
  { stage: 'design', agent: 'architect' },
  { stage: 'implement', agent: 'coder', after: 'design' },
  { stage: 'test', agent: 'tester', after: 'implement' },
  { stage: 'review', agent: 'reviewer', after: 'test' }
]);
```

### Adaptive Execution
```typescript
// Let swarm decide execution strategy
await swarm.autoOrchestrate({
  goal: 'Build production-ready API',
  constraints: {
    maxTime: 3600,
    maxAgents: 8,
    quality: 'high'
  }
});
```

## Memory Coordination

```typescript
// Share state across swarm
await swarm.memory.store('api-schema', {
  endpoints: [...],
  models: [...]
});

// Agents read shared memory
const schema = await swarm.memory.retrieve('api-schema');
```

## Advanced Features

### Load Balancing
```typescript
// Automatic work distribution
await swarm.enableLoadBalancing({
  strategy: 'dynamic',
  metrics: ['cpu', 'memory', 'task-queue']
});
```

### Fault Tolerance
```typescript
// Handle agent failures
await swarm.setResiliency({
  retry: { maxAttempts: 3, backoff: 'exponential' },
  fallback: 'reassign-task'
});
```

### Performance Monitoring
```typescript
// Track swarm metrics
const metrics = await swarm.getMetrics();
// { throughput, latency, success_rate, agent_utilization }
```

## Integration with Hooks

```bash
# Pre-task coordination
npx agentic-flow hooks pre-task --description "Build API"

# Post-task synchronization
npx agentic-flow hooks post-task --task-id "task-123"

# Session restore
npx agentic-flow hooks session-restore --session-id "swarm-001"
```

## Best Practices

1. **Start small**: Begin with 2-3 agents, scale up
2. **Use memory**: Share context through swarm memory
3. **Monitor metrics**: Track performance and bottlenecks
4. **Enable hooks**: Automatic coordination and sync
5. **Set timeouts**: Prevent hung tasks

## Troubleshooting

### Issue: Agents not coordinating
**Solution**: Verify memory access and enable hooks

### Issue: Poor performance
**Solution**: Check topology (use adaptive) and enable load balancing

## Phase 5: Real-Time Monitoring with Supervisors (v2.8.0+)

### Overview

Meta-orchestration enables hierarchical control of swarms through supervisor agents that monitor, interact, and coordinate multiple swarms simultaneously. This provides real-time visibility and intervention capabilities for complex multi-agent systems.

### Enabling Event Streaming

**CRITICAL**: Always spawn swarms with `--enable-events` for supervisor monitoring:

```bash
# ✅ CORRECT: Enable events for monitoring
npx claude-flow@alpha swarm init --topology mesh --enable-events --max-agents 8

# ✅ CORRECT: Quick spawn with events
npx claude-flow@alpha swarm "Build REST API" --claude --enable-events

# ❌ WRONG: No event streaming (supervisors blind)
npx claude-flow@alpha swarm init --topology mesh
```

**Why This Matters:**
- Supervisors need events to monitor progress
- Event streaming enables real-time status updates
- Without events, supervisors have no visibility
- Events are required for all supervisor patterns below

### Supervisor Patterns

### Pattern 1: Monitor & Report

Use when you need continuous progress updates and visibility:

```javascript
// Scenario: User wants real-time progress reports

// Step 1: Spawn main swarm with events enabled
Task("Initialize Swarm",
  "Set up mesh swarm for full-stack development with event streaming enabled",
  "coordinator",
  {
    command: "npx claude-flow@alpha swarm init --topology mesh --enable-events --max-agents 10",
    storeSwarmId: true
  }
)

// Step 2: Spawn worker agents in the swarm
Task("Spawn Development Agents",
  "Spawn backend, frontend, database, and testing agents in the swarm",
  "coordinator",
  {
    agents: ["backend-dev", "coder", "architect", "tester", "reviewer"],
    swarmId: "${SWARM_ID}" // From step 1
  }
)

// Step 3: Spawn monitor supervisor (separate from swarm)
Task("Monitor Supervisor",
  `Monitor swarm ${SWARM_ID} and generate progress reports every 3 minutes.
   Watch for errors, track task completion, and alert on issues.
   Create monitoring-report.md with current status.`,
  "monitor-supervisor",
  {
    swarmId: "${SWARM_ID}",
    reportInterval: 180000, // 3 minutes
    reportFile: "monitoring-report.md",
    alertThresholds: {
      errorRate: 0.1,
      stalledMinutes: 10,
      memoryUsage: 0.85
    }
  }
)

// Monitor Supervisor will automatically:
// - Call mcp__claude-flow__swarm_monitor to stream events
// - Query events every 3 minutes with swarm_query_events
// - Generate markdown reports with progress, issues, trends
// - Raise alerts when thresholds exceeded
// - Store snapshots in memory for historical analysis
```

**Monitor Supervisor Actions:**

```javascript
// Monitor continuously polls for events
await mcp__claude-flow__swarm_monitor({
  swarmId: "swarm-xyz123",
  streamEvents: true,
  filters: {
    eventTypes: ["task_started", "task_completed", "error", "agent_spawned"],
    minSeverity: "info"
  }
});

// Every 3 minutes: Query recent events
const events = await mcp__claude-flow__swarm_query_events({
  swarmId: "swarm-xyz123",
  since: Date.now() - 180000, // Last 3 minutes
  limit: 100
});

// Generate user-friendly report
await Write("monitoring-report.md", `
# Swarm Progress Report

**Status:** 🟢 Active
**Progress:** 67% (12/18 tasks complete)
**Active Agents:** 6 of 8

## Recent Events
1. ✅ Task-10 completed by coder-1 (4.2min)
2. 🚀 Task-15 started by optimizer-1
3. ⚠️  Warning: Memory at 78% on coder-2

## Performance
- Task rate: 0.27 tasks/min
- Success rate: 92%
- Estimated completion: 15:45 UTC

_Updated: ${new Date().toISOString()}_
`);
```

**Reading Monitor Reports:**

```javascript
// User checks progress
Read("monitoring-report.md")

// Or query historical snapshots
await mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "swarm/monitor/report-*",
  namespace: "coordination"
});
```

### Pattern 2: Interactive Control

Use when you need to intervene, resolve conflicts, or control swarm execution:

```javascript
// Scenario: Agent conflict needs resolution

// Step 1: Spawn swarm with events
Task("Initialize Development Swarm",
  "Create hierarchical swarm with queen and workers, events enabled",
  "coordinator",
  {
    command: "npx claude-flow@alpha swarm init --topology hierarchical --enable-events",
    storeSwarmId: true
  }
)

// Step 2: Spawn interaction supervisor
Task("Interaction Supervisor",
  `Manage communication between agents in swarm ${SWARM_ID}.
   Monitor for conflicts, facilitate agent-to-agent messages,
   intervene when needed, resolve deadlocks.
   Use swarm_message tool for agent communication.`,
  "interaction-supervisor",
  {
    swarmId: "${SWARM_ID}",
    interventionThresholds: {
      conflictSeverity: "medium",
      deadlockTimeout: 300000, // 5 minutes
      errorBurst: 10 // 10 errors in short time
    }
  }
)

// Interaction Supervisor capabilities:
// - Send messages between agents via swarm_message
// - Detect conflicts from event patterns
// - Pause/resume swarm execution
// - Reallocate work between agents
// - Escalate to queen when needed
```

**Interaction Supervisor Actions:**

```javascript
// Detect conflict from events
const events = await mcp__claude-flow__swarm_query_events({
  swarmId: "swarm-xyz123",
  eventTypes: ["conflict", "error"],
  since: Date.now() - 60000
});

// Analyze events and detect issue
if (events.filter(e => e.type === 'error' && e.agent === 'coder-1').length > 5) {
  // Intervene: Send message to agent
  await mcp__claude-flow__swarm_message({
    targetAgent: "coder-1",
    message: {
      type: "intervention",
      subject: "High error rate detected",
      body: "Please review recent errors and check dependencies",
      priority: "high"
    }
  });

  // Notify queen
  await mcp__claude-flow__swarm_message({
    targetAgent: "queen-coordinator",
    message: {
      type: "escalation",
      subject: "coder-1 experiencing issues",
      body: "Intervention sent, monitoring response"
    }
  });
}

// Resolve conflict between two agents
async function resolveConflict(agent1, agent2) {
  // Pause both agents
  await mcp__claude-flow__swarm_message({
    targetAgent: agent1,
    message: { type: "pause_request", reason: "Conflict resolution" }
  });

  // Get queen decision
  await mcp__claude-flow__memory_usage({
    action: "store",
    key: "swarm/conflicts/resolution-needed",
    namespace: "coordination",
    value: JSON.stringify({ agent1, agent2, timestamp: Date.now() })
  });

  // Communicate resolution once queen decides
  // ... (see interaction-supervisor.md for full pattern)
}
```

### Pattern 3: Multi-Swarm Coordination

Use when orchestrating multiple concurrent swarms that need coordination:

```javascript
// Scenario: Full-stack project with separate frontend, backend, database swarms

// Step 1: Spawn multiple swarms with events
Task("Initialize Multi-Swarm Architecture",
  `Create 3 swarms for full-stack development:
   1. Frontend swarm (React/TypeScript) - mesh topology
   2. Backend swarm (Node.js API) - hierarchical topology
   3. Database swarm (PostgreSQL) - mesh topology
   All swarms must have --enable-events`,
  "coordinator",
  {
    swarms: {
      frontend: { topology: "mesh", maxAgents: 6 },
      backend: { topology: "hierarchical", maxAgents: 8 },
      database: { topology: "mesh", maxAgents: 4 }
    }
  }
)

// Step 2: Spawn coordinator supervisor for all swarms
Task("Coordinator Supervisor",
  `Coordinate 3 swarms: frontend, backend, database.
   Synchronize memory between swarms (API contracts, schemas).
   Manage dependencies (backend needs database, frontend needs backend).
   Allocate resources dynamically based on progress.
   Generate aggregate status reports every 5 minutes.`,
  "coordinator-supervisor",
  {
    swarms: ["frontend-swarm-id", "backend-swarm-id", "database-swarm-id"],
    dependencies: {
      frontend: ["backend"],
      backend: ["database"],
      database: []
    },
    resourcePool: {
      totalAgents: 20,
      dynamicAllocation: true
    }
  }
)

// Step 3: Spawn monitor supervisor for EACH swarm
Task("Monitor Frontend Swarm", "Monitor frontend swarm progress", "monitor-supervisor")
Task("Monitor Backend Swarm", "Monitor backend swarm progress", "monitor-supervisor")
Task("Monitor Database Swarm", "Monitor database swarm progress", "monitor-supervisor")

// Coordinator Supervisor will:
// - Monitor all 3 swarms via swarm_monitor
// - Synchronize memory across namespaces (global, frontend, backend, database)
// - Manage dependencies (wait for database before backend proceeds)
// - Generate aggregate reports combining all swarm statuses
// - Reallocate resources (if backend overloaded, add agents from frontend)
```

**Coordinator Supervisor Actions:**

```javascript
// Memory synchronization between swarms
await mcp__claude-flow__memory_usage({
  action: "store",
  key: "global/contracts/database-schema",
  namespace: "global",
  value: JSON.stringify({
    table: "users",
    columns: [...],
    publishedBy: "database-swarm",
    dependents: ["backend-swarm"]
  })
});

// Notify dependent swarm
await mcp__claude-flow__swarm_message({
  targetSwarm: "backend-swarm", // All agents in backend swarm
  message: {
    type: "contract_published",
    subject: "Database schema available",
    location: "global/contracts/database-schema"
  }
});

// Generate aggregate report
const frontendStatus = await mcp__claude-flow__swarm_status({ swarmId: "frontend-id" });
const backendStatus = await mcp__claude-flow__swarm_status({ swarmId: "backend-id" });
const databaseStatus = await mcp__claude-flow__swarm_status({ swarmId: "database-id" });

await Write("coordination-report.md", `
# Multi-Swarm Coordination Report

## Overall Progress
**Frontend:** ${frontendStatus.progress}% (${frontendStatus.completedTasks}/${frontendStatus.totalTasks})
**Backend:** ${backendStatus.progress}% (${backendStatus.completedTasks}/${backendStatus.totalTasks})
**Database:** ${databaseStatus.progress}% (${databaseStatus.completedTasks}/${databaseStatus.totalTasks})

## Resource Allocation
**Frontend:** ${frontendStatus.activeAgents} agents
**Backend:** ${backendStatus.activeAgents} agents
**Database:** ${databaseStatus.activeAgents} agents

## Dependencies
✅ Database schema published
✅ Backend API endpoints defined
⏳ Frontend waiting for API documentation
`);
```

### Reading Supervisor Reports

Supervisors generate reports you can read:

```javascript
// Check monitoring report
Read("monitoring-report.md")

// Check coordination report
Read("coordination-report.md")

// Query historical snapshots
await mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "swarm/monitor/checkpoint-*",
  namespace: "coordination"
});

// Present to user
"Here's the current swarm status from the monitor supervisor:
[paste report contents]

Key highlights:
- 67% complete (12/18 tasks done)
- 6 agents actively working
- One warning: coder-2 has high memory usage
- Estimated completion in 30 minutes"
```

### Complete Example: End-to-End Meta-Orchestration

**User Request:** "Build a microservices architecture with real-time monitoring"

**Your Response:**

```javascript
// Complete workflow using all supervisor patterns

[Single Message - Spawn Everything Concurrently]:

// 1. Initialize main swarm with events
Task("Initialize Microservices Swarm",
  "Create adaptive swarm with event streaming for microservices architecture",
  "coordinator",
  {
    command: "npx claude-flow@alpha swarm init --topology adaptive --enable-events --max-agents 15"
  }
)

// 2. Spawn worker agents
Task("Backend Team",
  "Implement auth, user, and order services with Express and PostgreSQL",
  "backend-dev"
)
Task("DevOps Engineer",
  "Setup Docker, Kubernetes, and CI/CD pipeline",
  "cicd-engineer"
)
Task("Database Architect",
  "Design microservices database architecture with event sourcing",
  "architect"
)
Task("Quality Assurance",
  "Create integration tests for all microservices",
  "tester"
)

// 3. Spawn monitor supervisor for real-time visibility
Task("Monitor Supervisor",
  `Monitor microservices swarm with 2-minute report intervals.
   Track service implementation progress, detect errors, analyze performance.
   Generate monitoring-report.md with current status and trends.
   Alert if error rate exceeds 10% or any service stalls for >10 minutes.`,
  "monitor-supervisor",
  {
    reportInterval: 120000,
    alertThresholds: {
      errorRate: 0.1,
      stalledMinutes: 10,
      memoryUsage: 0.85
    }
  }
)

// 4. Spawn interaction supervisor for coordination
Task("Interaction Supervisor",
  `Manage communication between microservices teams.
   Resolve conflicts, facilitate agent-to-agent messages.
   Intervene if deadlocks detected or coordination breaks down.`,
  "interaction-supervisor"
)

// 5. Batch all todos in one call
TodoWrite({
  todos: [
    {content: "Initialize swarm with events", status: "in_progress", activeForm: "Initializing swarm"},
    {content: "Spawn development agents", status: "pending", activeForm: "Spawning agents"},
    {content: "Setup monitoring supervisor", status: "pending", activeForm: "Setting up monitoring"},
    {content: "Configure interaction supervisor", status: "pending", activeForm: "Configuring interactions"},
    {content: "Monitor progress every 2 minutes", status: "pending", activeForm: "Monitoring progress"},
    {content: "Generate final report", status: "pending", activeForm: "Generating report"}
  ]
})

// Result: You'll have:
// - Main swarm with 4 worker agents building microservices
// - Monitor supervisor generating reports every 2 minutes
// - Interaction supervisor handling agent communication
// - Real-time visibility into progress via monitoring-report.md
```

**After 2 Minutes:**

```javascript
// Check progress
Read("monitoring-report.md")

// Present to user:
"Here's the progress update from the monitor supervisor:

# Swarm Progress Report

**Status:** 🟢 Active
**Progress:** 25% (3/12 tasks complete)
**Runtime:** 2 minutes
**Active Agents:** 4 of 4

## Completed Tasks
✅ Task-1: Database schema design (Backend-dev, 1.8min)
✅ Task-2: Docker setup (DevOps, 2.1min)
✅ Task-3: Auth service structure (Backend-dev, 1.5min)

## In Progress
🚀 Task-4: User service implementation (Backend-dev)
🚀 Task-5: Kubernetes manifests (DevOps)
🚀 Task-6: Integration test framework (Tester)

## Performance
- Task rate: 1.5 tasks/min
- Success rate: 100%
- No errors detected
- Estimated completion: 14:45 UTC (8 minutes)

Everything is progressing smoothly!"
```

### Supervisor Integration Points

**Monitor Supervisor provides data to:**
- Users (via markdown reports)
- Interaction Supervisor (event analysis for interventions)
- Coordinator Supervisor (individual swarm status)
- Queen Coordinator (strategic overview)

**Interaction Supervisor receives from:**
- Monitor Supervisor (event data for conflict detection)
- Agents (direct communication requests)

**Coordinator Supervisor coordinates:**
- Multiple Monitor Supervisors (one per swarm)
- Multiple Interaction Supervisors (one per swarm)
- Cross-swarm memory synchronization
- Resource allocation between swarms

### Best Practices for Meta-Orchestration

**Do:**
- ✅ Always use `--enable-events` when spawning swarms
- ✅ Spawn supervisors as separate Tasks (not inside swarm)
- ✅ Let monitor supervisor update reports automatically
- ✅ Read supervisor reports to check progress
- ✅ Use interaction supervisor for agent communication
- ✅ Use coordinator supervisor for multi-swarm projects
- ✅ Store swarm IDs for supervisor reference

**Don't:**
- ❌ Forget `--enable-events` (supervisors will be blind)
- ❌ Spawn supervisors inside the swarm they monitor
- ❌ Manually poll swarm status (let supervisor handle it)
- ❌ Use swarm_message for data sharing (use memory)
- ❌ Intervene manually when supervisor can handle it
- ❌ Skip supervisors for complex multi-swarm projects

### Troubleshooting

**Issue:** Supervisor reports "No events detected"
**Solution:** Swarm not spawned with `--enable-events`. Restart swarm with events enabled.

**Issue:** Supervisor can't find swarm
**Solution:** Verify swarm ID is passed correctly. Store swarm ID in memory during initialization.

**Issue:** Reports not updating
**Solution:** Check monitor supervisor is still running. Verify event stream is active.

**Issue:** Agents not receiving messages
**Solution:** Verify using `swarm_message` tool correctly. Check agent IDs are valid.

## Learn More

- Swarm Guide: docs/swarm/orchestration.md
- Topology Patterns: docs/swarm/topologies.md
- Hooks Integration: docs/hooks/coordination.md
- **Meta-Orchestration Guide: TESTING_META_ORCHESTRATION.md**
- **Supervisor Agents: .claude/agents/supervisor/**
- **Observability API: docs/API_OBSERVABILITY.md**
