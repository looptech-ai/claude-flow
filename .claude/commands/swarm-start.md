---
name: swarm-start
description: Start a claude-flow swarm with clerk monitoring
---

# Start Swarm with Monitoring

Quick command to start a swarm and spawn a clerk observer.

## Usage

When user provides task description:

### 1. Start swarm

```bash
claude-flow swarm "[task description]" --background > swarm.log 2>&1 &
```

### 2. Spawn clerk observer

```javascript
Task("Swarm Observer", `
Monitor the swarm in background.

Check every 30 seconds:
- mcp__claude-flow__swarm_status()
- mcp__claude-flow__agent_list()

Report progress until complete.
`, "clerk")
```

### 3. Monitor alongside

```javascript
mcp__claude-flow__swarm_status()
mcp__claude-flow__agent_list()
```

### 4. Report to user

```
✅ Swarm started!

Task: [description]
Log: swarm.log
Clerk: Monitoring in background
Status: Use mcp__claude-flow__swarm_status()

Clerk will report every 30 seconds.
```

Simple swarm start with automatic monitoring.
