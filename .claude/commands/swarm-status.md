---
name: swarm-status
description: Check running swarm status with MCP tools
---

# Check Swarm Status

Quick status check using MCP tools.

## Usage

```javascript
// Check swarm status
const status = mcp__claude-flow__swarm_status()

// Get agent list
const agents = mcp__claude-flow__agent_list()

// Get performance
const perf = mcp__claude-flow__performance_report({ format: "summary" })

// Report
console.log(`
📊 Swarm Status

Agents: ${agents.count} active
Status: ${status.state}
Health: ${status.health}
Performance: ${perf.summary}
`)
```

Simple status check with MCP tools.
