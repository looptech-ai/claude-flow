# /swarm-status

Quick status check for claude-flow swarms

## Description

Get a quick status overview of running or completed claude-flow swarms using MCP tools.

## Instructions

When the user executes `/swarm-status [workspace-path]`, follow these steps:

1. **Determine Target**:
   - If workspace path provided: Check that specific swarm
   - If no path: Look for recent swarms in `/tmp/swarm-*` directories

2. **Use MCP Tools for Status**:
   ```javascript
   // Get swarm health and metrics
   mcp__claude-flow__swarm_status()

   // Get agent information
   mcp__claude-flow__agent_list()

   // Get task status
   mcp__claude-flow__task_status()

   // Get performance metrics
   mcp__claude-flow__performance_report({ format: "summary" })
   ```

3. **Check File System**:
   - Count files created
   - Check most recent file timestamps
   - Look for error indicators in logs

4. **Report Status**:
   Provide a concise status report with:
   - **Health**: Healthy / Degraded / Completed / Failed
   - **Files Created**: Count and types
   - **Active Agents**: Number and types
   - **Tasks**: Pending / In Progress / Completed counts
   - **Last Activity**: Timestamp of most recent change
   - **Errors**: Any errors from logs
   - **Estimated Progress**: Percentage if possible

## Example Usage

```
User: /swarm-status /tmp/swarm-1730745000/

Response:
## Swarm Status Report

**Health**: Healthy ✅
**Files Created**: 8 (4 .js, 2 .json, 1 .md, 1 .test.js)
**Active Agents**: 5 (coder, tester, reviewer, coordinator, researcher)
**Tasks**: 3 completed, 2 in progress, 1 pending
**Last Activity**: 15 seconds ago
**Progress**: ~65% estimated
**Errors**: None

Most recent files:
- server.js (156 lines, 30s ago)
- auth.middleware.js (42 lines, 45s ago)
```
