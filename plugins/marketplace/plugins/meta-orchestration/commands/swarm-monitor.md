# /swarm-monitor

Monitor an existing claude-flow swarm

## Description

Spawn an intelligent monitoring agent to track an already-running claude-flow swarm with real-time analysis and MCP tool integration.

## Instructions

When the user executes `/swarm-monitor <workspace-path>`, follow these steps:

1. **Validate Workspace**:
   - Check if workspace directory exists
   - Look for swarm.log or similar output files
   - Verify files are being created (indicates active swarm)

2. **Detect Swarm Type**:
   - Check for `REQUIREMENTS.md` or similar spec files
   - Scan existing files to understand what's being built
   - Look at log file for swarm objectives

3. **Spawn Intelligent Monitor**:
   ```javascript
   Task("Swarm Monitor", `
   Monitor existing swarm at <workspace-path>.

   Detected objective: <what swarm is building>

   Use MCP tools for comprehensive monitoring:
   - mcp__claude-flow__swarm_status - Health metrics
   - mcp__claude-flow__agent_list - Active agents
   - mcp__claude-flow__task_status - Task progress
   - mcp__archon__rag_search_knowledge_base - Best practices validation
   - mcp__context7__get-library-docs - Framework validation

   Provide real-time reports every 60 seconds with:
   1. Files created with purpose analysis
   2. Architecture validation
   3. Code quality assessment
   4. Best practices compliance
   5. Progress estimate

   Final comprehensive report when complete.
   `, "swarm-monitor")
   ```

4. **Inform User**:
   - Monitoring workspace: `<path>`
   - Detected objective: `<what's being built>`
   - Monitoring agent: Active
   - Reports: Every 60 seconds

## Example Usage

```
User: /swarm-monitor /tmp/swarm-1730745000/
```
