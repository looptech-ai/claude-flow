# Swarm Meta-Orchestration - Quick Reference

> Fast guide for using Claude Code to orchestrate and monitor claude-flow swarms

## ✅ Key Discovery: Task Agents Can Use MCP Tools

**VERIFIED**: Task-spawned agents have full access to all MCP tools (Nov 4, 2025)

## 🎯 Quick Decision Guide

| Scenario | Use This | Effectiveness |
|----------|----------|---------------|
| Need intelligent monitoring | Pattern 2 (Task + swarm-monitor) | ✅ 9/10 |
| Simple progress tracking | Pattern 1 (File-based) | 4/10 |
| Post-completion analysis | Pattern 4 (Post-execution) | 7/10 |
| HiveMind collective memory | Pattern 3 (SQLite) | 6/10 |

**Recommendation**: Use Pattern 2 for most scenarios.

## 🚀 Pattern 2: Intelligent Monitoring (Recommended)

```javascript
// 1. Start swarm in background
Bash("claude-flow swarm 'Build REST API' --background > /tmp/swarm.log 2>&1 &")

// 2. Spawn intelligent monitor with swarm-monitor subagent
Task("Intelligent Monitor", `
Monitor swarm at /tmp/workspace.
Swarm is building: REST API with authentication
Requirements: 5 CRUD endpoints, JWT auth, PostgreSQL

Use MCP tools for validation:
- mcp__claude-flow__swarm_status - Check health
- mcp__archon__rag_search_knowledge_base - Validate best practices
- mcp__context7__get-library-docs - Check framework conventions

Report every 60 seconds with intelligent insights.
`, "swarm-monitor")
```

**Key Features**:
- ✅ Real-time monitoring with context understanding
- ✅ Architecture validation against requirements
- ✅ Best practices compliance checking
- ✅ Code quality assessment
- ✅ 20 monitoring-specific MCP tools

## 📋 Available Monitoring MCP Tools

**Claude-Flow** (8 tools):
- `swarm_status`, `swarm_monitor`, `agent_list`, `agent_metrics`
- `task_status`, `task_results`, `performance_report`, `metrics_collect`

**Archon** (4 tools):
- `find_tasks`, `find_projects`
- `rag_search_knowledge_base`, `rag_search_code_examples`

**Linear** (2 tools):
- `list_issues`, `get_issue`

**Context7** (2 tools):
- `resolve-library-id`, `get-library-docs`

## 🤖 Swarm Monitor Subagent

**Location**: `.claude/agents/swarm-monitor`

**Status**: ✅ Production-ready

**Usage**:
```javascript
Task("description", "prompt", "swarm-monitor")
```

**What it does**:
1. Monitors file changes with purpose understanding
2. Validates architecture against requirements
3. Checks best practices compliance
4. Assesses code quality
5. Provides structured reports

## 📦 Pattern 1: File-Based (Simplest)

```javascript
// Start swarm
Bash("claude-flow swarm 'Build calculator' --background > swarm.log 2>&1 &")

// Monitor with basic file watching
Bash("tail -f swarm.log | grep -E 'created|completed|error'")
```

**Use when**: You just need basic progress visibility

## 📊 Pattern 4: Post-Execution (Most Reliable)

```javascript
// Run swarm to completion
Bash("claude-flow swarm 'Build calculator' > results.json 2>&1")

// Analyze after completion
Task("Analyzer", "Analyze completed swarm output in results.json", "general-purpose")
```

**Use when**: Real-time monitoring isn't critical

## 🧠 Pattern 3: HiveMind SQLite

```javascript
// Initialize hive-mind
Bash("claude-flow hive-mind init --name 'API-Build' --topology mesh")

// Spawn with events enabled
Bash("claude-flow hive-mind spawn 'Build REST API' --enable-events")

// Query collective memory
Bash("claude-flow hive-mind status")
```

**Use when**: Using hive-mind with persistent memory

## 🎯 Best Practices

1. **Always specify requirements** in monitoring prompts
2. **Use swarm-monitor subagent** for intelligent analysis
3. **Batch operations** in single messages
4. **Check swarm logs** for errors
5. **Validate against best practices** using MCP tools

## 🔧 Quick Setup

```bash
# Ensure MCP servers are configured
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add archon <archon-server-command>
claude mcp add context7 <context7-server-command>

# Verify swarm-monitor exists
ls .claude/agents/swarm-monitor
```

## ✅ Verified Results

- **Test Date**: Nov 4, 2025
- **Test Swarm**: Todo REST API (156 lines, 5 CRUD endpoints)
- **Monitor Effectiveness**: 9/10 vs basic 4/10
- **MCP Access**: ✅ Confirmed working
- **Production Ready**: ✅ Yes

## 📚 Full Documentation

See `SKILL.md` for detailed architecture, testing results, and extended examples.
