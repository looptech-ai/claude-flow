# Claude Flow Observability API Reference

Complete API documentation for Claude Flow v2.8.0 observability and meta-orchestration MCP tools.

## Table of Contents

1. [Overview](#overview)
2. [swarm_monitor](#swarm_monitor)
3. [swarm_message](#swarm_message)
4. [swarm_query_events](#swarm_query_events)
5. [Error Codes](#error-codes)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Overview

The observability API provides three MCP tools for real-time swarm monitoring, agent communication, and event querying. These tools enable hierarchical meta-orchestration through supervisor agents.

### Tool Summary

| Tool | Purpose | Use By |
|------|---------|--------|
| `swarm_monitor` | Real-time event streaming | Monitor Supervisor |
| `swarm_message` | Agent-to-agent messaging | Interaction Supervisor |
| `swarm_query_events` | Historical event queries | All Supervisors |

### Prerequisites

- Claude Flow v2.8.0+
- Swarm spawned with `--enable-events` flag
- MCP server configured: `claude mcp add claude-flow npx claude-flow@alpha mcp start`

---

## swarm_monitor

Monitor real-time events from a swarm execution stream.

### Signature

```typescript
mcp__claude-flow__swarm_monitor(params: SwarmMonitorParams): Promise<SwarmMonitorResponse>
```

### Parameters

```typescript
interface SwarmMonitorParams {
  // Required: Swarm identifier to monitor
  swarmId: string;

  // Optional: Enable continuous event streaming (default: true)
  streamEvents?: boolean;

  // Optional: Event filters
  filters?: {
    // Event types to include
    eventTypes?: EventType[];

    // Minimum severity level
    minSeverity?: 'debug' | 'info' | 'warn' | 'error' | 'critical';

    // Only events from specific agents
    agentIds?: string[];

    // Only events for specific tasks
    taskIds?: string[];

    // Time range (milliseconds since epoch)
    since?: number;
    until?: number;
  };

  // Optional: Polling interval in milliseconds (default: 2000)
  pollInterval?: number;

  // Optional: Maximum events to buffer (default: 1000)
  maxBufferSize?: number;
}

type EventType =
  | 'agent_spawned'
  | 'agent_failed'
  | 'agent_completed'
  | 'task_started'
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'error'
  | 'warning'
  | 'info'
  | 'status_change'
  | 'memory_update'
  | 'communication'
  | 'resource_usage';
```

### Response

```typescript
interface SwarmMonitorResponse {
  // Success status
  success: boolean;

  // Swarm identifier
  swarmId: string;

  // Current monitoring status
  status: 'active' | 'paused' | 'stopped' | 'error';

  // Event stream information
  stream: {
    // Is streaming active
    active: boolean;

    // Events per second rate
    eventsPerSecond: number;

    // Total events captured
    totalEvents: number;

    // Stream start time
    startedAt: number;
  };

  // Recent events (last batch)
  recentEvents: SwarmEvent[];

  // Monitoring statistics
  stats: {
    // Events by type
    eventsByType: Record<EventType, number>;

    // Events by severity
    eventsBySeverity: Record<string, number>;

    // Active agents count
    activeAgents: number;

    // Error count
    errors: number;

    // Warnings count
    warnings: number;
  };

  // Error if failed
  error?: string;
}

interface SwarmEvent {
  // Unique event identifier
  eventId: string;

  // Event type
  type: EventType;

  // Severity level
  severity: 'debug' | 'info' | 'warn' | 'error' | 'critical';

  // Timestamp (milliseconds since epoch)
  timestamp: number;

  // Source agent ID (if applicable)
  agentId?: string;

  // Related task ID (if applicable)
  taskId?: string;

  // Event payload
  data: {
    // Human-readable message
    message: string;

    // Additional structured data
    [key: string]: any;
  };

  // Event metadata
  metadata?: {
    // Event duration (if applicable)
    duration?: number;

    // Related event IDs
    relatedEvents?: string[];

    // Tags for categorization
    tags?: string[];
  };
}
```

### Examples

#### Basic Monitoring

```javascript
// Start monitoring a swarm
const response = await mcp__claude-flow__swarm_monitor({
  swarmId: "swarm-xyz123",
  streamEvents: true
});

console.log(`Monitoring active: ${response.stream.active}`);
console.log(`Events captured: ${response.stream.totalEvents}`);
console.log(`Recent events: ${response.recentEvents.length}`);
```

#### Filtered Monitoring

```javascript
// Monitor only errors and critical events
const response = await mcp__claude-flow__swarm_monitor({
  swarmId: "swarm-xyz123",
  streamEvents: true,
  filters: {
    minSeverity: 'error',
    eventTypes: ['error', 'agent_failed', 'task_failed']
  }
});

// Check for critical issues
if (response.stats.errors > 10) {
  console.log('⚠️ High error rate detected!');
}
```

#### Agent-Specific Monitoring

```javascript
// Monitor specific agent's events
const response = await mcp__claude-flow__swarm_monitor({
  swarmId: "swarm-xyz123",
  streamEvents: true,
  filters: {
    agentIds: ['agent-coder-1', 'agent-coder-2'],
    eventTypes: ['task_completed', 'task_failed', 'error']
  }
});

console.log(`Coder agents activity: ${response.recentEvents.length} events`);
```

### Error Handling

```javascript
try {
  const response = await mcp__claude-flow__swarm_monitor({
    swarmId: "swarm-xyz123"
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  // Process events
} catch (error) {
  if (error.code === 'SWARM_NOT_FOUND') {
    console.error('Swarm does not exist');
  } else if (error.code === 'EVENTS_NOT_ENABLED') {
    console.error('Swarm not spawned with --enable-events');
  } else {
    console.error('Monitoring error:', error.message);
  }
}
```

### Best Practices

1. **Always enable events:** Spawn swarms with `--enable-events` flag
2. **Use filters:** Reduce noise by filtering relevant events
3. **Adjust poll interval:** Balance between latency and overhead (default 2000ms is good)
4. **Monitor buffer size:** Increase for high-event-rate swarms
5. **Handle errors:** Check response.success and handle errors gracefully

---

## swarm_message

Send messages between agents or broadcast to swarm.

### Signature

```typescript
mcp__claude-flow__swarm_message(params: SwarmMessageParams): Promise<SwarmMessageResponse>
```

### Parameters

```typescript
interface SwarmMessageParams {
  // Target agent ID (for direct message)
  targetAgent?: string;

  // Target swarm ID (for broadcast to all agents)
  targetSwarm?: string;

  // Message content
  message: {
    // Message type
    type: 'notification' | 'request' | 'response' | 'command' | 'broadcast' | 'intervention' | 'escalation';

    // Message subject
    subject: string;

    // Message body
    body: string;

    // Priority level
    priority?: 'low' | 'normal' | 'high' | 'critical';

    // Optional action to take
    action?: string;

    // Optional structured data
    data?: Record<string, any>;

    // Optional expiration time (milliseconds since epoch)
    expiresAt?: number;

    // Optional required acknowledgment
    requireAck?: boolean;
  };

  // Optional sender identification
  from?: string;

  // Optional thread ID for conversation tracking
  threadId?: string;

  // Optional reply-to message ID
  replyTo?: string;
}
```

### Response

```typescript
interface SwarmMessageResponse {
  // Success status
  success: boolean;

  // Unique message ID
  messageId: string;

  // Delivery status
  status: 'sent' | 'delivered' | 'failed' | 'pending';

  // Recipients (agent IDs)
  recipients: string[];

  // Delivery timestamp
  sentAt: number;

  // Delivery confirmations (if requireAck was true)
  acknowledgments?: {
    agentId: string;
    acknowledgedAt: number;
  }[];

  // Error if failed
  error?: string;
}
```

### Examples

#### Direct Message

```javascript
// Send message to specific agent
const response = await mcp__claude-flow__swarm_message({
  targetAgent: "agent-reviewer-1",
  message: {
    type: "request",
    subject: "Code review needed",
    body: "Please review auth.service.ts for security issues",
    priority: "high",
    action: "review_code",
    data: {
      file: "auth.service.ts",
      changes: 127,
      concerns: ["authentication", "authorization"]
    }
  },
  from: "agent-coder-1",
  threadId: "thread-review-auth"
});

console.log(`Message sent: ${response.messageId}`);
console.log(`Delivered to: ${response.recipients.length} agents`);
```

#### Broadcast Message

```javascript
// Broadcast to all agents in swarm
const response = await mcp__claude-flow__swarm_message({
  targetSwarm: "swarm-xyz123",
  message: {
    type: "broadcast",
    subject: "API schema updated",
    body: "New API schema available in global memory at key: global/contracts/api-schema-v2",
    priority: "normal",
    action: "refresh_schema"
  },
  from: "coordinator-supervisor"
});

console.log(`Broadcast to ${response.recipients.length} agents`);
```

#### Intervention

```javascript
// Supervisor intervention message
const response = await mcp__claude-flow__swarm_message({
  targetAgent: "agent-coder-2",
  message: {
    type: "intervention",
    subject: "High error rate detected",
    body: "You have 12 errors in the last 5 minutes. Please review recent changes and check dependencies.",
    priority: "critical",
    action: "pause_and_review",
    data: {
      errorCount: 12,
      timeWindow: 300000, // 5 minutes
      suggestedAction: "Review error logs and restart if needed"
    },
    requireAck: true
  },
  from: "interaction-supervisor"
});

// Wait for acknowledgment
if (response.acknowledgments) {
  console.log('Agent acknowledged intervention');
}
```

#### Conflict Resolution

```javascript
// Notify agents of conflict resolution
const response = await mcp__claude-flow__swarm_message({
  targetAgent: "agent-coder-1",
  message: {
    type: "response",
    subject: "Conflict resolved",
    body: "Queen has decided on approach A. Please proceed with JWT authentication using refresh tokens.",
    priority: "high",
    action: "implement_approach_a",
    data: {
      decision: "approach_a",
      reasoning: "Better scalability and security",
      nextSteps: ["Implement JWT", "Add refresh token logic", "Update tests"]
    }
  },
  from: "interaction-supervisor",
  threadId: "conflict-auth-approach",
  replyTo: "msg-conflict-escalation-123"
});
```

### Error Handling

```javascript
try {
  const response = await mcp__claude-flow__swarm_message({
    targetAgent: "agent-coder-1",
    message: {
      type: "notification",
      subject: "Test",
      body: "Test message"
    }
  });

  if (!response.success) {
    throw new Error(response.error);
  }

} catch (error) {
  if (error.code === 'AGENT_NOT_FOUND') {
    console.error('Target agent does not exist');
  } else if (error.code === 'MESSAGE_TOO_LARGE') {
    console.error('Message body exceeds size limit (use memory for large data)');
  } else if (error.code === 'DELIVERY_FAILED') {
    console.error('Failed to deliver message');
  } else {
    console.error('Messaging error:', error.message);
  }
}
```

### Best Practices

1. **Use memory for data:** Messages are for notifications, not data transfer
2. **Set appropriate priority:** Reserve "critical" for emergencies
3. **Include actionable information:** Tell agents what to do
4. **Use threads:** Track related messages with threadId
5. **Don't flood:** Batch notifications when possible
6. **Require ack for critical:** Use requireAck for important interventions

---

## swarm_query_events

Query historical events from swarm execution.

### Signature

```typescript
mcp__claude-flow__swarm_query_events(params: SwarmQueryEventsParams): Promise<SwarmQueryEventsResponse>
```

### Parameters

```typescript
interface SwarmQueryEventsParams {
  // Required: Swarm identifier
  swarmId: string;

  // Optional: Event filters (same as swarm_monitor)
  filters?: {
    eventTypes?: EventType[];
    minSeverity?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    agentIds?: string[];
    taskIds?: string[];
    since?: number;
    until?: number;
  };

  // Optional: Result pagination
  limit?: number;  // Max results (default: 100, max: 1000)
  offset?: number; // Skip first N results (default: 0)

  // Optional: Sort order
  sortBy?: 'timestamp' | 'severity' | 'type';
  sortOrder?: 'asc' | 'desc'; // Default: 'desc' (newest first)

  // Optional: Include event context
  includeContext?: boolean; // Include related events (default: false)
}
```

### Response

```typescript
interface SwarmQueryEventsResponse {
  // Success status
  success: boolean;

  // Swarm identifier
  swarmId: string;

  // Query results
  events: SwarmEvent[];

  // Result metadata
  metadata: {
    // Total matching events (before pagination)
    totalCount: number;

    // Events returned in this response
    returnedCount: number;

    // Query execution time (ms)
    queryTime: number;

    // Applied filters
    filters: Record<string, any>;

    // Pagination info
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };

  // Error if failed
  error?: string;
}
```

### Examples

#### Recent Events

```javascript
// Query last 3 minutes of events
const response = await mcp__claude-flow__swarm_query_events({
  swarmId: "swarm-xyz123",
  filters: {
    since: Date.now() - 180000 // Last 3 minutes
  },
  limit: 100
});

console.log(`Found ${response.events.length} recent events`);

// Process events
for (const event of response.events) {
  console.log(`${event.timestamp}: ${event.type} - ${event.data.message}`);
}
```

#### Error Analysis

```javascript
// Query all errors in last hour
const response = await mcp__claude-flow__swarm_query_events({
  swarmId: "swarm-xyz123",
  filters: {
    eventTypes: ['error', 'agent_failed', 'task_failed'],
    since: Date.now() - 3600000 // Last hour
  },
  limit: 500
});

// Analyze error patterns
const errorsByAgent = {};
for (const event of response.events) {
  const agent = event.agentId || 'unknown';
  errorsByAgent[agent] = (errorsByAgent[agent] || 0) + 1;
}

console.log('Errors by agent:', errorsByAgent);
```

#### Task Progress Tracking

```javascript
// Query events for specific task
const response = await mcp__claude-flow__swarm_query_events({
  swarmId: "swarm-xyz123",
  filters: {
    taskIds: ['task-auth-implementation'],
    eventTypes: ['task_started', 'task_progress', 'task_completed', 'task_failed']
  },
  sortBy: 'timestamp',
  sortOrder: 'asc'
});

// Build timeline
const timeline = response.events.map(e => ({
  time: new Date(e.timestamp).toISOString(),
  event: e.type,
  message: e.data.message
}));

console.log('Task timeline:', timeline);
```

#### Paginated Query

```javascript
// Query large result set with pagination
let allEvents = [];
let offset = 0;
const limit = 100;

while (true) {
  const response = await mcp__claude-flow__swarm_query_events({
    swarmId: "swarm-xyz123",
    filters: {
      eventTypes: ['task_completed']
    },
    limit,
    offset
  });

  allEvents = allEvents.concat(response.events);

  if (!response.metadata.pagination.hasMore) {
    break;
  }

  offset += limit;
}

console.log(`Retrieved ${allEvents.length} total events`);
```

#### Performance Analysis

```javascript
// Analyze task performance
const response = await mcp__claude-flow__swarm_query_events({
  swarmId: "swarm-xyz123",
  filters: {
    eventTypes: ['task_completed'],
    since: Date.now() - 3600000 // Last hour
  },
  limit: 1000
});

// Calculate statistics
const durations = response.events
  .filter(e => e.metadata?.duration)
  .map(e => e.metadata.duration);

const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
const maxDuration = Math.max(...durations);
const minDuration = Math.min(...durations);

console.log(`Avg task duration: ${avgDuration}ms`);
console.log(`Max task duration: ${maxDuration}ms`);
console.log(`Min task duration: ${minDuration}ms`);
```

### Error Handling

```javascript
try {
  const response = await mcp__claude-flow__swarm_query_events({
    swarmId: "swarm-xyz123",
    limit: 100
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  // Process events
} catch (error) {
  if (error.code === 'SWARM_NOT_FOUND') {
    console.error('Swarm does not exist');
  } else if (error.code === 'EVENTS_NOT_AVAILABLE') {
    console.error('Event storage not initialized');
  } else if (error.code === 'QUERY_TIMEOUT') {
    console.error('Query took too long (reduce time range or limit)');
  } else {
    console.error('Query error:', error.message);
  }
}
```

### Best Practices

1. **Use time ranges:** Always specify since/until to limit result size
2. **Paginate large queries:** Use limit and offset for >1000 results
3. **Filter appropriately:** Use eventTypes and severity to reduce results
4. **Cache results:** Store query results if doing multiple analyses
5. **Monitor query time:** Optimize queries that take >1 second

---

## Error Codes

Common error codes across all observability tools:

| Code | Description | Solution |
|------|-------------|----------|
| `SWARM_NOT_FOUND` | Swarm ID doesn't exist | Verify swarm ID is correct |
| `EVENTS_NOT_ENABLED` | Swarm not event-enabled | Respawn with `--enable-events` |
| `AGENT_NOT_FOUND` | Target agent doesn't exist | List agents and verify ID |
| `INVALID_PARAMS` | Invalid parameters | Check parameter types/values |
| `PERMISSION_DENIED` | Insufficient permissions | Check authentication |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Slow down request rate |
| `STREAM_ERROR` | Event stream error | Restart monitoring |
| `MESSAGE_TOO_LARGE` | Message exceeds size limit | Use memory for large data |
| `DELIVERY_FAILED` | Message not delivered | Check agent status |
| `QUERY_TIMEOUT` | Query took too long | Reduce query scope |
| `STORAGE_ERROR` | Event storage error | Check disk space |

---

## Best Practices

### General Guidelines

1. **Enable Events First:** Always spawn swarms with `--enable-events`
2. **Use Appropriate Tools:** Monitor for real-time, query for historical
3. **Filter Aggressively:** Reduce noise with precise filters
4. **Handle Errors Gracefully:** Always check response.success
5. **Respect Rate Limits:** Don't overwhelm the system

### Performance Tips

1. **Batch Operations:** Consolidate multiple messages into broadcasts
2. **Use Pagination:** Query large result sets in chunks
3. **Adjust Poll Intervals:** Balance latency vs overhead
4. **Cache Frequently Used Data:** Don't query same data repeatedly
5. **Monitor Your Monitors:** Track supervisor performance

### Security Considerations

1. **Validate Inputs:** Always validate swarmId and agentId
2. **Sanitize Messages:** Don't include sensitive data in messages
3. **Use Memory for Secrets:** Never send secrets via messages
4. **Check Permissions:** Verify authorization before operations
5. **Log Security Events:** Track authentication failures

---

## Examples

### Complete Monitor Supervisor Pattern

```javascript
// Initialize monitoring
let monitoringActive = true;
let swarmId = "swarm-xyz123";

// Start monitoring stream
const monitor = await mcp__claude-flow__swarm_monitor({
  swarmId,
  streamEvents: true,
  filters: {
    minSeverity: 'info'
  }
});

// Monitoring loop (every 3 minutes)
setInterval(async () => {
  if (!monitoringActive) return;

  // Query recent events
  const events = await mcp__claude-flow__swarm_query_events({
    swarmId,
    filters: {
      since: Date.now() - 180000 // Last 3 minutes
    },
    limit: 100
  });

  // Analyze events
  const analysis = analyzeEvents(events.events);

  // Generate report
  await generateReport(analysis);

  // Raise alerts if needed
  if (analysis.criticalIssues.length > 0) {
    await raiseAlerts(analysis.criticalIssues);
  }

}, 180000); // 3 minutes

function analyzeEvents(events) {
  const errors = events.filter(e => e.type === 'error');
  const completions = events.filter(e => e.type === 'task_completed');

  return {
    totalEvents: events.length,
    errorCount: errors.length,
    completionCount: completions.length,
    errorRate: errors.length / events.length,
    criticalIssues: errors.length > 10 ? ['High error rate'] : []
  };
}
```

### Complete Interaction Supervisor Pattern

```javascript
// Conflict resolution workflow
async function resolveConflict(agent1, agent2, issue) {
  // Step 1: Pause both agents
  await mcp__claude-flow__swarm_message({
    targetAgent: agent1,
    message: {
      type: 'intervention',
      subject: 'Conflict resolution in progress',
      body: 'Please pause work and provide your perspective',
      priority: 'high',
      requireAck: true
    }
  });

  await mcp__claude-flow__swarm_message({
    targetAgent: agent2,
    message: {
      type: 'intervention',
      subject: 'Conflict resolution in progress',
      body: 'Please pause work and provide your perspective',
      priority: 'high',
      requireAck: true
    }
  });

  // Step 2: Get perspectives from memory
  const perspective1 = await getAgentPerspective(agent1);
  const perspective2 = await getAgentPerspective(agent2);

  // Step 3: Escalate to queen for decision
  await mcp__claude-flow__memory_usage({
    action: 'store',
    key: 'swarm/conflicts/resolution-needed',
    namespace: 'coordination',
    value: JSON.stringify({
      agent1, agent2, issue,
      perspective1, perspective2,
      timestamp: Date.now()
    })
  });

  await mcp__claude-flow__swarm_message({
    targetAgent: 'queen-coordinator',
    message: {
      type: 'escalation',
      subject: 'Agent conflict requires resolution',
      body: `Conflict between ${agent1} and ${agent2}`,
      priority: 'critical',
      action: 'make_decision'
    }
  });

  // Step 4: Wait for decision and communicate
  const decision = await waitForQueenDecision();

  await mcp__claude-flow__swarm_message({
    targetAgent: agent1,
    message: {
      type: 'response',
      subject: 'Conflict resolved',
      body: decision.reasoning,
      action: decision.action_for_agent1,
      priority: 'high'
    }
  });

  await mcp__claude-flow__swarm_message({
    targetAgent: agent2,
    message: {
      type: 'response',
      subject: 'Conflict resolved',
      body: decision.reasoning,
      action: decision.action_for_agent2,
      priority: 'high'
    }
  });
}
```

---

## Additional Resources

- **Testing Guide:** [TESTING_META_ORCHESTRATION.md](../TESTING_META_ORCHESTRATION.md)
- **Supervisor Agents:** [.claude/agents/supervisor/](../.claude/agents/supervisor/)
- **Swarm Orchestration Skill:** [.claude/skills/swarm-orchestration/skill.md](../.claude/skills/swarm-orchestration/skill.md)
- **GitHub Repository:** https://github.com/ruvnet/claude-flow

---

**API Version:** 1.0.0
**Last Updated:** 2025-11-04
**Compatible With:** Claude Flow v2.8.0+
