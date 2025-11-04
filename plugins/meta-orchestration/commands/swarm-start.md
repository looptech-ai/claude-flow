# /swarm-start

Start a claude-flow swarm with intelligent monitoring

## Description

This command starts a claude-flow swarm and automatically spawns an intelligent monitoring agent to track progress, validate architecture, and ensure code quality.

## Instructions

When the user executes `/swarm-start "<task description>"`, follow these steps:

1. **Validate Requirements**:
   - Ensure claude-flow is installed (`which claude-flow` or check npm global packages)
   - Check if MCP server is configured
   - Verify workspace directory exists

2. **Create Workspace**:
   - Create `/tmp/swarm-<timestamp>/` directory for swarm output
   - Note the workspace path for monitoring

3. **Start Swarm in Background**:
   ```bash
   cd /tmp/swarm-<timestamp> && claude-flow swarm "<task>" --background > swarm.log 2>&1 &
   ```

4. **Spawn Intelligent Monitor**:
   Use the Task tool with the `swarm-monitor` subagent:
   ```javascript
   Task("Swarm Monitor", `
   Monitor swarm at /tmp/swarm-<timestamp>.

   Task: <task description>

   Requirements: <extract from user's task if any>

   Use MCP tools to:
   - Track swarm health with mcp__claude-flow__swarm_status
   - Monitor agent performance with mcp__claude-flow__agent_metrics
   - Validate best practices with mcp__archon__rag_search_knowledge_base
   - Check framework conventions with mcp__context7__get-library-docs

   Report every 60 seconds with intelligent insights.
   Provide final comprehensive analysis when swarm completes.
   `, "swarm-monitor")
   ```

5. **Inform User**:
   - Workspace: `/tmp/swarm-<timestamp>/`
   - Log file: `swarm.log`
   - Monitoring: Active with intelligent analysis
   - Expected completion: Estimate based on task complexity

## Example Usage

```
User: /swarm-start "Build REST API with JWT authentication and PostgreSQL"