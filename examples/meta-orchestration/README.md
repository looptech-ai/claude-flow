# Meta-Orchestration Examples

This directory contains working examples demonstrating meta-orchestration capabilities in Claude Flow - where one Claude agent supervises and coordinates other Claude swarms.

## Overview

Meta-orchestration enables powerful workflows where a supervisor Claude can:
- Monitor multiple worker swarms in real-time
- Send messages and coordinate between swarms
- Make dynamic decisions based on progress
- Generate comprehensive reports
- Scale resources based on needs

## Architecture

```
                    Supervisor Claude
                    ┌──────────────────┐
                    │ Monitors events  │
                    │ Sends messages   │
                    │ Coordinates work │
                    │ Generates reports│
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼─────┐     ┌────▼──────┐
              │ Worker    │     │ Worker    │
              │ Swarm 1   │     │ Swarm 2   │
              └───────────┘     └───────────┘
                    │                 │
                    └────────┬────────┘
                             │
                      Event Streams
                   (.claude-flow/events/)
```

## Examples

### 1. basic-monitoring.js

**Purpose:** Learn the fundamentals of swarm monitoring

**What it demonstrates:**
- Spawning a worker swarm with event streaming
- Monitoring events in real-time
- Displaying progress updates
- Sending messages to workers
- Generating final reports

**Run:**
```bash
node examples/meta-orchestration/basic-monitoring.js
```

**Duration:** ~10-30 minutes (depending on task complexity)

**Output:**
- Real-time progress updates every 5 seconds
- Event breakdown by type
- Active agents list
- Recent activity log
- Final report with metrics

**Example Output:**
```
🎯 Swarm Supervisor Starting...

📦 Step 1: Spawning worker swarm...
   Session ID: worker-1704110400000
   Instruction: Build a simple REST API with authentication using Express.js
   Max Agents: 3

👀 Step 2: Starting event monitoring...
   Monitoring interval: Every 5 seconds

✅ Supervisor active. Press Ctrl+C to stop.

────────────────────────────────────────────────────────────
📊 Progress Update
────────────────────────────────────────────────────────────
Total Events: 12

Event Breakdown:
  swarm.start          1
  agent.spawn          3
  task.assign          2
  task.start           2
  task.complete        2
  memory.store         2

Active Agents: 3
  - agent-1
  - agent-2
  - agent-3

Recent Activity:
  [10:15:23] task.complete agent-1
  [10:15:20] task.progress agent-1
  [10:15:15] task.start agent-1
────────────────────────────────────────────────────────────
```

### 2. multi-swarm-coordination.js

**Purpose:** Advanced multi-swarm coordination and management

**What it demonstrates:**
- Running multiple swarms in parallel
- Cross-swarm coordination and messaging
- Shared memory between swarms
- Aggregate progress reporting
- Dynamic resource allocation
- Dependency management between swarms

**Run:**
```bash
node examples/meta-orchestration/multi-swarm-coordination.js
```

**Duration:** ~30-60 minutes

**Swarms Spawned:**
1. **Backend Swarm** - REST API with Express.js and PostgreSQL (3 agents)
2. **Frontend Swarm** - React UI with authentication (2 agents)
3. **Database Swarm** - PostgreSQL schema design (2 agents)

**Output:**
- Individual swarm status updates
- Cross-swarm coordination messages
- Aggregate metrics across all swarms
- Resource utilization reports
- Final comprehensive report

**Example Output:**
```
🎯 Multi-Swarm Coordinator Starting...

📦 Step 1: Spawning swarms in parallel...

   Spawning backend swarm...
     Session ID: backend-1704110400000
     Max Agents: 3
     Priority: high

   Spawning frontend swarm...
     Session ID: frontend-1704110400001
     Max Agents: 2
     Priority: high

   Spawning database swarm...
     Session ID: database-1704110400002
     Max Agents: 2
     Priority: medium

═══════════════════════════════════════════════════════════
📊 AGGREGATE PROGRESS REPORT
═══════════════════════════════════════════════════════════

BACKEND Swarm:
  Status: 🔄 Running
  Events: 45
  Agents: 3
  Tasks Completed: 8
  Runtime: 15m

FRONTEND Swarm:
  Status: 🔄 Running
  Events: 32
  Agents: 2
  Tasks Completed: 5
  Runtime: 15m

DATABASE Swarm:
  Status: ✅ Completed
  Events: 28
  Agents: 2
  Tasks Completed: 4
  Runtime: 12m

────────────────────────────────────────────────────────────
OVERALL:
  Swarms Completed: 1/3
  Total Events: 105
  Total Agents: 7
  Total Tasks: 17
  Progress: 33%
═══════════════════════════════════════════════════════════

📨 Coordination: Sending to frontend: "Backend API endpoints are ready for integration"
```

## Configuration

### Environment Variables

```bash
# Events directory (optional, defaults to .claude-flow/events)
export CLAUDE_FLOW_EVENTS_DIR=/path/to/events

# Monitor interval in milliseconds (optional, default: 5000)
export MONITOR_INTERVAL=10000

# Memory namespace (optional)
export MEMORY_NAMESPACE=my-project
```

### Example Configuration

Both examples use configuration objects that can be customized:

```javascript
const CONFIG = {
  eventsDir: path.join(process.cwd(), '.claude-flow', 'events'),
  monitorIntervalMs: 5000,
  maxAgents: 3,
  timeout: 30, // minutes
};
```

## Event File Location

Events are written to: `.claude-flow/events/`

Format: `swarm-{sessionId}-{timestamp}.jsonl`

Example: `swarm-worker-1704110400000-2025-01-01T10-00-00Z.jsonl`

## Event Types

### Core Events

- `swarm.start` - Swarm initialization
- `swarm.complete` - Swarm completion
- `agent.spawn` - Agent created
- `agent.terminate` - Agent stopped
- `task.assign` - Task assigned to agent
- `task.start` - Task started
- `task.progress` - Task progress update
- `task.complete` - Task completed
- `task.failed` - Task failed

### Coordination Events

- `coordination.sync` - Agents synchronizing
- `coordination.handoff` - Work handoff between agents
- `memory.store` - Memory written
- `memory.retrieve` - Memory read
- `error` - Error occurred

## Messages

Send messages to workers:

```javascript
// In supervisor code
await supervisor.sendMessageToWorker('Speed up execution');

// Messages are written to:
// .claude-flow/events/messages-{sessionId}.jsonl
```

Workers can read messages from memory or event stream.

## Advanced Usage

### Custom Event Filters

```javascript
// Monitor only specific event types
const result = await tools.monitor({
  sessionId: 'my-session',
  eventTypes: ['task.complete', 'error'],
  format: 'json',
});
```

### Event Queries

```javascript
// Query events with filters and aggregations
const result = await tools.queryEvents({
  sessionId: 'my-session',
  filters: {
    eventTypes: ['task.complete'],
    agentId: 'agent-1',
    timeRange: {
      start: '2025-01-01T10:00:00Z',
      end: '2025-01-01T11:00:00Z',
    },
  },
  aggregations: {
    countByType: true,
    countByAgent: true,
    timeline: true,
  },
});
```

### Dynamic Scaling

```javascript
// Check if swarm needs more agents
const eventRate = swarm.events.length / (runtime / 1000);
if (eventRate < 0.1) {
  console.log('⚠️  Swarm progressing slowly. Consider scaling up.');
  // Could spawn additional agents here
}
```

## Troubleshooting

### No events appearing

**Check:**
1. Event streaming is enabled: `--enable-events`
2. Events directory exists and is writable
3. Worker swarm is actually running
4. Correct session ID is being used

```bash
# Check events directory
ls -la .claude-flow/events/

# Check for event files
ls .claude-flow/events/swarm-*.jsonl
```

### Monitor not showing updates

**Check:**
1. Monitor interval is reasonable (5-10 seconds)
2. Event file is being written to
3. No errors in supervisor logs

```bash
# Manually check event file
cat .claude-flow/events/swarm-worker-*.jsonl | jq
```

### Messages not reaching workers

**Check:**
1. Message file exists
2. Workers are reading from correct namespace
3. Memory system is functioning

```bash
# Check messages file
cat .claude-flow/events/messages-*.jsonl | jq
```

## Performance Tips

1. **Set appropriate monitor interval** - Too frequent polling wastes resources
2. **Use event filters** - Only monitor events you care about
3. **Limit event retention** - Clean up old event files
4. **Use aggregations** - More efficient than processing all events
5. **Buffer events** - Don't flush after every single event

## Best Practices

### For Supervisors

1. **Start monitoring before spawning workers** - Don't miss early events
2. **Handle worker failures gracefully** - Expect errors
3. **Set timeouts** - Workers shouldn't run forever
4. **Clean up resources** - Terminate workers on supervisor exit
5. **Log coordinator decisions** - Make coordination visible

### For Workers

1. **Emit meaningful events** - Include context in event data
2. **Check for messages periodically** - Read coordinator messages
3. **Use shared memory** - Coordinate via memory namespace
4. **Report progress regularly** - Keep supervisor informed
5. **Handle termination gracefully** - Respond to shutdown signals

## Integration with MCP

These examples can be enhanced with MCP tools:

```javascript
// Use MCP tools for monitoring
const mcpResult = await callMCPTool('swarm/monitor', {
  sessionId: workerSessionId,
  lines: 50,
  format: 'summary',
});

// Send messages via MCP
await callMCPTool('swarm/message', {
  sessionId: workerSessionId,
  message: 'Checkpoint reached',
  broadcast: true,
});

// Query events via MCP
const events = await callMCPTool('swarm/query_events', {
  sessionId: workerSessionId,
  filters: { eventTypes: ['task.complete'] },
  aggregations: { countByType: true },
});
```

## Further Reading

- [Integration Tests](../../tests/integration/README.md) - Test specifications
- [E2E Tests](../../tests/e2e/meta-orchestration.test.ts) - Complete workflow tests
- [Validation Script](../../scripts/validate-meta-orchestration.sh) - Automated validation
- [Main Documentation](../../docs/) - Full Claude Flow documentation

## Contributing

To add new examples:

1. Create new `.js` file in this directory
2. Follow existing example structure
3. Include comprehensive comments
4. Add configuration section
5. Test thoroughly
6. Update this README

## Questions?

For help with meta-orchestration:
1. Check example code and comments
2. Review test specifications
3. Examine event fixtures
4. Consult main documentation
5. Open an issue on GitHub

## License

MIT - See [LICENSE](../../LICENSE) file for details
