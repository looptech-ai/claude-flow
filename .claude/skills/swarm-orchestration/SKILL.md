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

## Phase 6: Production-Ready Meta-Orchestration Patterns (UPDATED)

### Critical Discovery: Two Command Paradigms

**`hive-mind spawn`** - Infrastructure only (agents idle):
```bash
claude-flow hive-mind spawn coder "task"  # ❌ Spawns but doesn't work
```

**`swarm "task"`** - Actually executes:
```bash
claude-flow swarm "task" --background  # ✅ Spawns AND works
```

### Pattern 1: Swarm with File-Based Monitoring (RECOMMENDED)

Most reliable pattern for actual execution:

```javascript
// User: "Build a calculator API, monitor progress"

You: [Single Message - Spawn + Monitor]:
  // 1. Start working swarm in background
  Bash({
    command: `cd project-dir && claude-flow swarm "Build calculator REST API with Express. POST /calculate endpoint with {operation: add|subtract|multiply|divide, a, b} returning {result}. Include validation." --background --max-agents 3`,
    run_in_background: true,
    description: "Spawn working swarm"
  })

  // 2. Spawn monitor supervisor immediately
  Task("Monitor Supervisor", `
    Monitor the swarm via log files.

    TASK:
    1. Wait 5 seconds for swarm initialization
    2. Find swarm log: find project-dir/swarm-runs -name "swarm.log" | tail -1
    3. Monitor every 30 seconds:
       bash: tail -20 <log-file>
       Look for: "Agent spawned", "Task completed", "Error", "Failed"
    4. Report to primary every 2 minutes:
       - Tasks completed (count "Task completed")
       - Active agents (count "Agent spawned")
       - Errors (count "Error" or "Failed")
       - Files created (ls project-dir/*.js project-dir/*.json)
    5. Alert if:
       - No activity for 5+ minutes
       - Error count > 3
       - Process exited (check: ps aux | grep claude-flow)

    OUTPUT FORMAT:
    "Progress Update:
     ✓ Tasks: 3 completed
     ⚙️  Agents: coder (active), tester (active)
     📁 Files: server.js, package.json created
     ⏱️  Runtime: 4 minutes
     🎯 Status: In progress, ~2 minutes remaining"
  `, "general-purpose")
```

**Why This Works:**
- Uses `swarm` command (actually executes)
- `--background` prevents blocking
- `run_in_background: true` prevents timeout
- File-based monitoring (reliable, no MCP needed)
- Supervisor reports real progress

### Pattern 2: HiveMind with SQLite Monitoring

When you need database-level visibility:

```javascript
// User: "Create a data pipeline with full visibility"

You: [Single Message]:
  // 1. Initialize database
  Bash("cd project-dir && claude-flow hive-mind init")

  // 2. Spawn agents
  Bash("claude-flow hive-mind spawn coder --batch 2 --swarm-id pipeline-swarm")
  Bash("claude-flow hive-mind spawn tester --swarm-id pipeline-swarm")

  // 3. Spawn database monitor
  Task("Database Monitor", `
    Monitor HiveMind via SQLite database.

    DATABASE: ./project-dir/.hive-mind/hive.db

    Every 30 seconds, execute SQL queries:
    1. Agent status:
       sqlite3 hive.db "SELECT name, status, role FROM agents"
    2. Task progress:
       sqlite3 hive.db "SELECT COUNT(*), status FROM tasks GROUP BY status"
    3. Recent activity:
       sqlite3 hive.db "SELECT * FROM session_logs ORDER BY timestamp DESC LIMIT 5"
    4. Memory usage:
       sqlite3 hive.db "SELECT COUNT(*) FROM collective_memory"

    Report every 2 minutes:
    - Agent utilization (active/idle counts)
    - Task distribution (pending/in_progress/completed/failed)
    - Recent logs (formatted)
    - Memory entries count
  `, "general-purpose")

  // 4. IMPORTANT: Manually dispatch work
  Bash(`claude-flow hive-mind task create "Build data pipeline with ETL, validation, error handling" --swarm-id pipeline-swarm --assign auto`)
```

**Why This Pattern:**
- Database gives complete visibility
- Can query exact agent states
- No MCP tools required
- **Critical:** Must manually dispatch tasks with `task create`

### Pattern 3: Multi-Swarm Coordinator

For parallel independent workstreams:

```javascript
// User: "Migrate 3 microservices simultaneously, coordinate them"

You: [Single Message - 3 Swarms + Coordinator]:
  // Spawn 3 independent swarms
  Bash({
    command: "cd services/auth && claude-flow swarm 'Migrate auth-service to new schema' --background",
    run_in_background: true
  })
  Bash({
    command: "cd services/user && claude-flow swarm 'Migrate user-service to new schema' --background",
    run_in_background: true
  })
  Bash({
    command: "cd services/payment && claude-flow swarm 'Migrate payment-service to new schema' --background",
    run_in_background: true
  })

  // Coordinator supervises all
  Task("Multi-Swarm Coordinator", `
    Coordinate 3 parallel migration swarms.

    SWARMS:
    1. Auth service: services/auth/swarm-runs
    2. User service: services/user/swarm-runs
    3. Payment service: services/payment/swarm-runs

    EVERY 60 SECONDS:
    For each swarm:
    - Find latest log: find services/*/swarm-runs -name "swarm.log" | sort -t/ -k2
    - Check progress: tail -5 <log>
    - Detect completion: grep "✓ Complete" <log> || grep "✗ Failed" <log>
    - Count files: ls services/*/migrations/*.sql | wc -l

    DEPENDENCIES:
    - Auth must complete before User can run integration tests
    - Payment depends on User service schema being ready

    COORDINATION:
    - If auth completes, notify: "✓ Auth done, User service can test"
    - If user schema ready, notify: "✓ User schema migrated, Payment can integrate"
    - Block payment integration until user complete

    REPORT EVERY 2 MINUTES:
    "Migration Status:
     🔐 Auth: ✓ Complete (5 migrations applied)
     👤 User: ⚙️  In Progress (3/7 migrations, 60%)
     💳 Payment: ⏸️  Waiting for User (blocked)
     📊 Overall: 53% complete, ETA 8 minutes"
  `, "general-purpose")
```

**Why Multi-Swarm:**
- Complete isolation (separate processes)
- No shared state conflicts
- Can run in different directories
- Coordinator aggregates progress

### Pattern 4: Intervention Supervisor

Monitor and intervene when issues detected:

```javascript
// User: "Build API, but intervene if there are problems"

You: [Single Message]:
  Bash({
    command: "claude-flow swarm 'Build REST API...' --background",
    run_in_background: true
  })

  Task("Intervention Supervisor", `
    Monitor swarm and intervene on issues.

    MONITORING:
    1. Track error rate: grep -c "Error\|Failed" <log-file>
    2. Detect patterns: grep "TypeError\|undefined\|ENOENT" <log-file>
    3. Check file quality: wc -l *.js (if > 500 lines, flag for refactor)

    INTERVENTION THRESHOLDS:
    - Error rate > 20%: Simplify approach
    - Same error 3+ times: Change strategy
    - File > 500 lines: Suggest refactor
    - No progress 10+ min: Restart with different approach

    INTERVENTION ACTIONS:
    - Cannot send messages to swarm (MCP tool not accessible yet)
    - Instead: Report to primary for manual intervention
    - Suggest: "High error rate detected. Recommend: restart with simpler validation logic"

    REPORT FORMAT:
    "Alert: High Error Rate (30%)
     Pattern: TypeErrors in validation logic
     Suggestion: Restart swarm with simpler validation:
       claude-flow swarm 'Build API with basic string validation only' --background

     Files so far: server.js (450 lines - good), validation.js (89 lines - good)
     Recommendation: Salvage server.js, rewrite validation.js"
  `, "general-purpose")
```

**Intervention Capabilities:**
- ✅ Detect issues via log analysis
- ✅ Generate recommendations
- ✅ Report to primary orchestrator (me)
- ❌ Cannot send messages to swarm yet (planned feature)

### Key Learnings:

1. **Use `swarm` not `hive-mind spawn`** - For actual execution
2. **Always `--background`** - For long-running tasks
3. **`run_in_background: true`** - In Bash tool to prevent timeout
4. **File-based monitoring** - Most reliable (tail logs)
5. **SQLite monitoring** - When you need exact state
6. **Supervisor in separate Task** - Not in swarm itself
7. **Report format** - User-friendly progress updates
8. **Intervention** - Via primary orchestrator (not direct yet)

### What Doesn't Work Yet:

❌ Event file streaming (use log files instead)
❌ Direct swarm messaging (mcp__claude-flow__swarm_message not accessible)
❌ Auto-task-dispatch from hive-mind spawn
❌ Real-time MCP monitoring tools

### What DOES Work:

✅ Background swarm execution
✅ Log file monitoring via supervisor
✅ SQLite database queries
✅ Multi-swarm coordination
✅ Progress reporting to user
✅ Issue detection and recommendations

---

## Learn More

- Swarm Guide: docs/swarm/orchestration.md
- Topology Patterns: docs/swarm/topologies.md
- Hooks Integration: docs/hooks/coordination.md
- **Meta-Orchestration Guide: TESTING_META_ORCHESTRATION.md**
- **Meta-Orchestration Analysis: docs/META_ORCHESTRATION_ANALYSIS.md**
- **Supervisor Agents: .claude/agents/supervisor/**
- **Observability API: docs/API_OBSERVABILITY.md**
