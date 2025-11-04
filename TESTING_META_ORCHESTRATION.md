# Testing Meta-Orchestration with Observability

Complete testing guide for Claude Flow v2.8.0 meta-orchestration features including supervisor agents, event streaming, and hierarchical swarm control.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation for Testing](#installation-for-testing)
3. [Test 1: Basic Event Streaming](#test-1-basic-event-streaming)
4. [Test 2: Monitor Supervisor](#test-2-monitor-supervisor)
5. [Test 3: Agent Messaging](#test-3-agent-messaging)
6. [Test 4: Full Meta-Orchestration](#test-4-full-meta-orchestration)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Testing](#advanced-testing)

---

## Prerequisites

Before testing meta-orchestration features, ensure you have:

- **Node.js 20+** (LTS recommended)
  ```bash
  node --version  # Should be v20.0.0 or higher
  ```

- **Claude Code** installed globally
  ```bash
  npm install -g @anthropic-ai/claude-code
  claude --version
  ```

- **Git** for branch management
  ```bash
  git --version
  ```

- **Terminal** with support for ANSI colors (most modern terminals)

- **API Key** from Anthropic (set in environment or Claude Code config)

---

## Installation for Testing

### Step 1: Clone and Checkout Branch

```bash
# Navigate to your workspace
cd ~/dev

# Clone repository (if not already cloned)
git clone https://github.com/ruvnet/claude-flow.git
cd claude-flow

# Checkout feature branch
git checkout feature/meta-orchestration-observability

# Verify branch
git branch --show-current
# Should output: feature/meta-orchestration-observability
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list agentic-flow
# Should show agentic-flow@1.5.13 or higher
```

### Step 3: Build Project

```bash
# Build TypeScript to JavaScript
npm run build

# Verify build output
ls dist-cjs/src/mcp/
# Should include: swarm-tools.js, mcp-server.js, etc.
```

### Step 4: Link for Local Testing

```bash
# Create global symlink for testing
npm link

# Verify link
which claude-flow
# Should point to your local clone

# Test CLI
npx claude-flow --version
# Should output: 2.8.0-alpha.x
```

### Step 5: Verify Event Streaming Support

```bash
# Check for observability tools
npx claude-flow mcp tools list | grep -E "swarm_monitor|swarm_message|swarm_query_events"

# Should output:
# - swarm_monitor
# - swarm_message
# - swarm_query_events
```

---

## Test 1: Basic Event Streaming

**Objective:** Verify swarms can be spawned with event streaming enabled.

### Test Steps

```bash
# Step 1: Initialize swarm with events
npx claude-flow@alpha swarm init --topology mesh --enable-events --max-agents 5

# Expected output:
# ✅ Swarm initialized: swarm-xyz123
# ✅ Event streaming enabled
# 📡 Events available via swarm_monitor

# Store swarm ID for later use
export SWARM_ID="swarm-xyz123"  # Replace with actual ID from output
```

```bash
# Step 2: Verify event streaming is active
npx claude-flow@alpha swarm status

# Expected output should include:
# Swarm ID: swarm-xyz123
# Status: active
# Events: enabled
# Event stream: active
```

```bash
# Step 3: Spawn an agent to generate events
npx claude-flow@alpha swarm spawn coder "Implement hello world function"

# Expected output:
# ✅ Agent spawned: agent-coder-1
# 📝 Event published: agent_spawned
```

```bash
# Step 4: Check if events were captured
# (This would normally be done by MCP tools in Claude Code)
# For testing, verify swarm directory has event logs

ls -la .swarm/events/
# Should show event log files if events are being recorded
```

### Expected Results

- ✅ Swarm initializes with `--enable-events` flag
- ✅ Event streaming status shows as "enabled"
- ✅ Agent spawn generates events
- ✅ Events are accessible for querying

### Troubleshooting Test 1

**Issue:** `--enable-events` flag not recognized
- **Cause:** Feature not available in current build
- **Solution:** Verify branch is `feature/meta-orchestration-observability` and rebuild

**Issue:** No events directory created
- **Cause:** Event system not initialized
- **Solution:** Check `.swarm/` directory exists, reinitialize swarm

---

## Test 2: Monitor Supervisor

**Objective:** Test monitor supervisor agent with real-time reporting.

### Test Setup

Create a test project directory:

```bash
mkdir -p ~/test-meta-orchestration
cd ~/test-meta-orchestration

# Initialize Claude Flow
npx claude-flow@alpha init --force
```

### Test Steps with Claude Code

**Step 1:** Start Claude Code and run this prompt:

```
Initialize a mesh swarm with event streaming for building a simple REST API.
Spawn a monitor supervisor to track progress and generate reports every 2 minutes.

Requirements:
1. Spawn swarm with --enable-events
2. Spawn 3 agents: coder, tester, reviewer
3. Spawn monitor-supervisor agent
4. Monitor should create monitoring-report.md
```

**Step 2:** Claude Code should execute:

```javascript
// Agent spawning sequence
Task("Initialize Swarm",
  "Create mesh swarm with events enabled",
  "coordinator",
  { command: "npx claude-flow@alpha swarm init --topology mesh --enable-events --max-agents 5" }
)

Task("Spawn Development Agents",
  "Spawn coder, tester, reviewer agents",
  "coordinator"
)

Task("Monitor Supervisor",
  "Monitor swarm and generate progress reports every 2 minutes",
  "monitor-supervisor",
  {
    reportInterval: 120000,
    reportFile: "monitoring-report.md"
  }
)
```

**Step 3:** Wait 2 minutes, then check for report:

```bash
# Check if report was created
ls -la monitoring-report.md

# Read report
cat monitoring-report.md
```

### Expected Results

**Initial Report (after 2 minutes):**

```markdown
# Swarm Monitoring Report

**Session ID:** swarm-xyz123
**Started:** 2025-11-04 14:30:00 UTC
**Last Updated:** 2025-11-04 14:32:00 UTC
**Status:** 🟢 ACTIVE

---

## Executive Summary

✅ **Overall Health:** Good
📊 **Progress:** 15% complete (2/13 tasks)
⏱️ **Runtime:** 2 minutes
👥 **Active Agents:** 3 of 3 spawned

**Key Metrics:**
- Task completion rate: 1.0 tasks/minute
- Success rate: 100%
- Average task duration: 1.5 minutes
- Events processed: 23

---

## Current Status

### Active Tasks (3)
1. **Task-3** - API route implementation (Agent: coder) - 40% complete
2. **Task-4** - Unit test setup (Agent: tester) - 20% complete
3. **Task-5** - Code structure review (Agent: reviewer) - 10% complete

### Completed Tasks (2)
✅ Task-1: Project setup (coder, 1.2min)
✅ Task-2: Dependencies install (coder, 1.8min)

---

## Performance Analysis

### Task Completion Timeline
```
14:30 ██░░░░░░░░░░ 1 task
14:32 ████░░░░░░░░ 2 tasks (current)
```

---

## Event Highlights

### Last 5 Events
1. `14:31:45` 🚀 Task-5 started by reviewer
2. `14:31:30` 🚀 Task-4 started by tester
3. `14:31:12` ✅ Task-2 completed by coder (duration: 1.8min)
4. `14:30:20` 🚀 Task-3 started by coder
5. `14:30:05` ✅ Task-1 completed by coder (duration: 1.2min)

---

## Issues & Alerts

### 🟢 No Issues Detected

---

## Next Monitoring Update
**Scheduled:** 14:34:00 UTC (2 minutes)

_Report generated by Monitor Supervisor Agent v1.0.0_
```

### Validation Checklist

- ✅ Report file `monitoring-report.md` created
- ✅ Report updates every 2 minutes
- ✅ Progress percentage calculated correctly
- ✅ Events are captured and displayed
- ✅ Performance metrics are tracked
- ✅ Timestamps are accurate
- ✅ No errors in report generation

### Troubleshooting Test 2

**Issue:** Report not created
- Check monitor supervisor is running: `ps aux | grep monitor-supervisor`
- Verify events are enabled: `npx claude-flow@alpha swarm status`
- Check logs: `tail -f .swarm/logs/monitor-supervisor.log`

**Issue:** Report not updating
- Verify report interval setting
- Check if monitor supervisor crashed
- Ensure swarm is still active

**Issue:** "No events detected" in report
- Swarm must be spawned with `--enable-events`
- Restart swarm with events enabled
- Verify event stream: `ls .swarm/events/`

---

## Test 3: Agent Messaging

**Objective:** Test interaction supervisor and agent-to-agent messaging.

### Test Steps with Claude Code

**Prompt:**

```
Create a scenario where two agents need to communicate:
1. Spawn a hierarchical swarm with events
2. Spawn coder and reviewer agents
3. Spawn interaction-supervisor to manage communication
4. Have coder request a review from reviewer
5. Use swarm_message tool for communication
```

**Expected Execution:**

```javascript
// Step 1: Initialize swarm
Task("Initialize Hierarchical Swarm",
  "Create hierarchical swarm with queen and workers",
  "coordinator",
  { command: "npx claude-flow@alpha swarm init --topology hierarchical --enable-events" }
)

// Step 2: Spawn agents
Task("Coder Agent",
  "Implement authentication feature",
  "coder"
)

Task("Reviewer Agent",
  "Review code quality and security",
  "reviewer"
)

// Step 3: Spawn interaction supervisor
Task("Interaction Supervisor",
  "Manage agent communication and resolve conflicts",
  "interaction-supervisor",
  {
    swarmId: "${SWARM_ID}",
    interventionThresholds: { conflictSeverity: "medium" }
  }
)
```

### Test Interaction Pattern

**Step 1:** Coder stores request in memory:

```javascript
await mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/messages/coder-to-reviewer",
  namespace: "coordination",
  value: JSON.stringify({
    from: "coder-1",
    to: "reviewer-1",
    type: "request",
    subject: "Code review needed",
    body: "Please review auth.service.ts for security issues",
    priority: "high",
    timestamp: Date.now()
  })
});
```

**Step 2:** Interaction supervisor sends message:

```javascript
await mcp__claude-flow__swarm_message({
  targetAgent: "reviewer-1",
  message: {
    type: "notification",
    subject: "New review request from coder-1",
    body: "Check memory key: swarm/messages/coder-to-reviewer",
    action: "read_memory_and_respond"
  }
});
```

**Step 3:** Reviewer reads request and responds:

```javascript
// Reviewer reads request
const request = await mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "swarm/messages/coder-to-reviewer",
  namespace: "coordination"
});

// Reviewer stores response
await mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/messages/reviewer-to-coder-response",
  namespace: "coordination",
  value: JSON.stringify({
    from: "reviewer-1",
    to: "coder-1",
    type: "response",
    subject: "Review complete",
    body: "Code looks good. Minor suggestions: ...",
    findings: ["suggestion-1", "suggestion-2"],
    approved: true,
    timestamp: Date.now()
  })
});
```

### Expected Results

- ✅ Coder agent stores message request in memory
- ✅ Interaction supervisor detects request
- ✅ Supervisor sends notification via `swarm_message`
- ✅ Reviewer agent receives notification
- ✅ Reviewer reads request from memory
- ✅ Reviewer stores response in memory
- ✅ Coder reads response and continues work

### Validation

```bash
# Check memory for messages
npx claude-flow@alpha memory list --namespace coordination

# Should show:
# - swarm/messages/coder-to-reviewer
# - swarm/messages/reviewer-to-coder-response
```

### Troubleshooting Test 3

**Issue:** Messages not delivered
- Verify `swarm_message` tool is available
- Check target agent ID is correct
- Ensure agents are in same swarm

**Issue:** Memory not synchronized
- Check namespace is "coordination"
- Verify memory persistence is enabled
- Test memory read/write manually

---

## Test 4: Full Meta-Orchestration

**Objective:** Complete end-to-end test with multiple swarms and all supervisor types.

### Test Scenario: Microservices Architecture

**User Prompt:**

```
Build a microservices architecture with:
- Frontend service (React)
- Backend service (Node.js API)
- Database service (PostgreSQL)

Requirements:
1. Use separate swarms for each service
2. Coordinate between swarms
3. Monitor all swarms with real-time reports
4. Manage inter-swarm communication
```

### Expected Orchestration

```javascript
[Single Message - Complete Meta-Orchestration]:

// Step 1: Initialize 3 swarms
Task("Initialize Frontend Swarm",
  "Create mesh swarm for React frontend with events",
  "coordinator",
  { command: "npx claude-flow@alpha swarm init --topology mesh --enable-events --name frontend-swarm" }
)

Task("Initialize Backend Swarm",
  "Create hierarchical swarm for API backend with events",
  "coordinator",
  { command: "npx claude-flow@alpha swarm init --topology hierarchical --enable-events --name backend-swarm" }
)

Task("Initialize Database Swarm",
  "Create mesh swarm for database with events",
  "coordinator",
  { command: "npx claude-flow@alpha swarm init --topology mesh --enable-events --name database-swarm" }
)

// Step 2: Spawn coordinator supervisor
Task("Coordinator Supervisor",
  `Coordinate all 3 swarms: frontend, backend, database.
   Manage dependencies (backend needs database, frontend needs backend).
   Synchronize memory across swarms.
   Generate aggregate reports every 5 minutes.`,
  "coordinator-supervisor",
  {
    swarms: ["${FRONTEND_ID}", "${BACKEND_ID}", "${DATABASE_ID}"],
    dependencies: {
      frontend: ["backend"],
      backend: ["database"],
      database: []
    }
  }
)

// Step 3: Spawn monitor supervisors (one per swarm)
Task("Monitor Frontend", "Monitor frontend swarm progress", "monitor-supervisor", { swarmId: "${FRONTEND_ID}" })
Task("Monitor Backend", "Monitor backend swarm progress", "monitor-supervisor", { swarmId: "${BACKEND_ID}" })
Task("Monitor Database", "Monitor database swarm progress", "monitor-supervisor", { swarmId: "${DATABASE_ID}" })

// Step 4: Spawn interaction supervisors (one per swarm)
Task("Interaction Frontend", "Manage frontend agent communication", "interaction-supervisor", { swarmId: "${FRONTEND_ID}" })
Task("Interaction Backend", "Manage backend agent communication", "interaction-supervisor", { swarmId: "${BACKEND_ID}" })
Task("Interaction Database", "Manage database agent communication", "interaction-supervisor", { swarmId: "${DATABASE_ID}" })

// Step 5: Spawn worker agents in each swarm
Task("Frontend Developers", "Build React UI with TypeScript", "coder", { swarmId: "${FRONTEND_ID}" })
Task("Backend Developers", "Build Express API with auth", "backend-dev", { swarmId: "${BACKEND_ID}" })
Task("Database Architects", "Design PostgreSQL schema", "architect", { swarmId: "${DATABASE_ID}" })

// Todo tracking
TodoWrite({
  todos: [
    {content: "Initialize 3 swarms", status: "in_progress", activeForm: "Initializing swarms"},
    {content: "Spawn coordinator supervisor", status: "pending", activeForm: "Spawning coordinator"},
    {content: "Spawn monitor supervisors", status: "pending", activeForm: "Spawning monitors"},
    {content: "Spawn interaction supervisors", status: "pending", activeForm: "Spawning interactions"},
    {content: "Spawn worker agents", status: "pending", activeForm: "Spawning workers"},
    {content: "Verify coordination", status: "pending", activeForm: "Verifying coordination"},
    {content: "Check all reports", status: "pending", activeForm: "Checking reports"},
    {content: "Test memory sync", status: "pending", activeForm: "Testing memory sync"}
  ]
})
```

### Verification Steps

**After 5 Minutes:**

```bash
# Step 1: Check individual monitoring reports
cat monitoring-report-frontend.md
cat monitoring-report-backend.md
cat monitoring-report-database.md

# Step 2: Check coordination report
cat coordination-report.md
```

**Expected Coordination Report:**

```markdown
# Multi-Swarm Coordination Report

**Generated:** 2025-11-04 14:35:00 UTC
**Coordinator:** coordinator-supervisor

---

## Executive Summary

**Overall Progress:** 45% average across all swarms
**Active Agents:** 12 total (4 frontend, 5 backend, 3 database)
**Completed Tasks:** 15 total
**Pending Tasks:** 18 total
**Error Rate:** 2%

---

## Swarm Status

### frontend Swarm
- **Progress:** 40% (5/12 tasks)
- **Active Agents:** 4
- **Status:** 🟢 Active
- **Recent:** UI components completed

### backend Swarm
- **Progress:** 50% (7/14 tasks)
- **Active Agents:** 5
- **Status:** 🟢 Active
- **Recent:** Authentication endpoints live

### database Swarm
- **Progress:** 75% (3/4 tasks)
- **Active Agents:** 3
- **Status:** 🟢 Active
- **Recent:** Schema migration ready

---

## Dependencies

✅ Database schema published (backend can proceed)
✅ Backend API endpoints defined (frontend can proceed)
🟢 All dependencies resolved

---

## Resource Allocation

**Frontend:** 4 agents (optimal)
**Backend:** 5 agents (optimal)
**Database:** 3 agents (optimal)

---

## Issues (1)

### WARNING: backend
High memory usage on backend-coder-2 (82%)

---

## Recommendations (2)

### MEDIUM
Backend swarm progressing faster than frontend. Consider reallocating 1 agent from backend to frontend.

### LOW
Database swarm near completion. Prepare to scale down resources.

---

_Next update in 5 minutes_
```

### Validation Checklist

**Swarm Coordination:**
- ✅ All 3 swarms initialized successfully
- ✅ Swarms have event streaming enabled
- ✅ Coordinator supervisor tracking all swarms

**Supervisors:**
- ✅ Coordinator supervisor running (1)
- ✅ Monitor supervisors running (3 - one per swarm)
- ✅ Interaction supervisors running (3 - one per swarm)

**Reports:**
- ✅ Individual monitoring reports (3 files)
- ✅ Coordination aggregate report (1 file)
- ✅ Reports updating at correct intervals
- ✅ Reports show accurate data

**Memory Synchronization:**
- ✅ Database published schema to global namespace
- ✅ Backend subscribed to database schema
- ✅ Frontend subscribed to backend API
- ✅ Cross-swarm data accessible

**Dependencies:**
- ✅ Database completed before backend proceeded
- ✅ Backend API ready before frontend used it
- ✅ Dependency checks working correctly

### Expected Files After Test

```
test-meta-orchestration/
├── .swarm/
│   ├── events/
│   │   ├── frontend-swarm-events.log
│   │   ├── backend-swarm-events.log
│   │   └── database-swarm-events.log
│   ├── coordination/
│   │   └── coordinator-20251104-143500.md
│   ├── reports/
│   │   ├── monitor-frontend-20251104-143500.md
│   │   ├── monitor-backend-20251104-143500.md
│   │   └── monitor-database-20251104-143500.md
│   └── logs/
│       ├── coordinator-supervisor.log
│       ├── monitor-supervisor-frontend.log
│       ├── monitor-supervisor-backend.log
│       ├── monitor-supervisor-database.log
│       ├── interaction-supervisor-frontend.log
│       ├── interaction-supervisor-backend.log
│       └── interaction-supervisor-database.log
├── monitoring-report-frontend.md
├── monitoring-report-backend.md
├── monitoring-report-database.md
└── coordination-report.md
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "swarm_monitor tool not found"

**Cause:** MCP tools not properly registered

**Solution:**
```bash
# Re-add MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Restart Claude Code
claude restart

# Verify tools
npx claude-flow@alpha mcp tools list
```

#### Issue: "Event streaming not available"

**Cause:** Feature not built or branch incorrect

**Solution:**
```bash
# Verify branch
git branch --show-current
# Should be: feature/meta-orchestration-observability

# Rebuild
npm run build

# Re-link
npm link
```

#### Issue: Reports not generating

**Cause:** Monitor supervisor not running or crashed

**Solution:**
```bash
# Check supervisor process
ps aux | grep monitor-supervisor

# Check logs
tail -f .swarm/logs/monitor-supervisor.log

# Restart supervisor
# (Re-spawn via Claude Code Task)
```

#### Issue: "Swarm not event-enabled"

**Cause:** Forgot `--enable-events` flag

**Solution:**
```bash
# WRONG:
npx claude-flow@alpha swarm init --topology mesh

# CORRECT:
npx claude-flow@alpha swarm init --topology mesh --enable-events
```

#### Issue: Memory not synchronized between swarms

**Cause:** Different namespaces or memory not persisted

**Solution:**
```bash
# Use global namespace for shared data
# In coordinator-supervisor:
await mcp__claude-flow__memory_usage({
  action: "store",
  key: "global/contracts/api-schema",
  namespace: "global",  # ← Use "global" for cross-swarm
  value: JSON.stringify(schema)
});
```

#### Issue: Agents not receiving messages

**Cause:** Wrong agent ID or swarm ID

**Solution:**
```bash
# List agents to get correct IDs
npx claude-flow@alpha agent list

# Use exact agent ID in swarm_message
await mcp__claude-flow__swarm_message({
  targetAgent: "agent-coder-1",  # ← Use exact ID from agent list
  message: { ... }
});
```

---

## Advanced Testing

### Performance Testing

Test supervisor overhead and scalability:

```bash
# Test 1: Supervisor performance with many events
# Spawn swarm with 10 agents, monitor performance

# Test 2: Multiple swarms coordination
# Spawn 5 swarms, verify coordinator can handle load

# Test 3: Event query performance
# Generate 1000 events, query with different filters
```

### Stress Testing

```bash
# Spawn maximum agents
npx claude-flow@alpha swarm init --topology mesh --enable-events --max-agents 50

# Generate rapid events
for i in {1..100}; do
  npx claude-flow@alpha swarm spawn coder "Task $i" &
done

# Monitor supervisor handling
tail -f monitoring-report.md
```

### Integration Testing

Test with real projects:

```bash
# Clone real project
git clone https://github.com/example/real-project
cd real-project

# Use meta-orchestration to build
claude # Launch Claude Code

# Prompt: "Build this project using meta-orchestration with monitoring"
```

---

## Next Steps

After successful testing:

1. **Provide Feedback:** Open issues on GitHub with test results
2. **Try Advanced Patterns:** Experiment with custom supervisor configurations
3. **Performance Tuning:** Adjust report intervals and thresholds
4. **Integration:** Use in real projects and document learnings

---

## Support

- **Documentation:** [API_OBSERVABILITY.md](docs/API_OBSERVABILITY.md)
- **Agent Definitions:** `.claude/agents/supervisor/`
- **GitHub Issues:** https://github.com/ruvnet/claude-flow/issues
- **Discord:** https://discord.com/invite/dfxmpwkG2D

---

**Testing Guide Version:** 1.0.0
**Last Updated:** 2025-11-04
**Compatible With:** Claude Flow v2.8.0-alpha.x
