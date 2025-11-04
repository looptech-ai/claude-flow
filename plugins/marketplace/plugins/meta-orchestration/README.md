# Claude Flow Meta-Orchestration Plugin

> Intelligent swarm orchestration and monitoring for claude-flow with MCP tool integration

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/looptech-ai/claude-flow)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Overview

This plugin extends Claude Code with production-ready patterns for orchestrating and monitoring claude-flow swarms. It provides intelligent monitoring agents that understand code architecture, validate best practices, and deliver actionable insights.

**Developed by**: [Loop](https://looptech.ai) - Enhanced fork of claude-flow

## Features

### 🤖 Intelligent Monitoring Agent

- **Purpose Understanding**: Analyzes what files do, not just that they exist
- **Architecture Validation**: Compares implementation against requirements
- **Best Practices**: Validates code against framework conventions using MCP tools
- **Code Quality**: Assesses error handling, validation, and security
- **20 MCP Tools**: Monitoring-specific tools from claude-flow, Archon, Linear, and Context7

**Effectiveness**: 9/10 vs basic file-counting 4/10 (verified Nov 4, 2025)

### 📋 Slash Commands

- `/swarm-start` - Start a swarm with automatic intelligent monitoring
- `/swarm-monitor` - Monitor an existing swarm with real-time analysis
- `/swarm-status` - Quick status check with health metrics

### 🧠 Meta-Orchestration Skill

Provides 4 production-ready patterns for swarm supervision:
1. **Intelligent Monitoring** (9/10) - Task tool + MCP integration ✅ Recommended
2. **File-Based** (4/10) - Simple progress visibility
3. **HiveMind SQLite** (6/10) - Collective memory queries
4. **Post-Execution** (7/10) - Analysis after completion

## Installation

### Option 1: From Local Clone (Development)

```bash
# Clone the repo if you haven't already
git clone https://github.com/looptech-ai/claude-flow.git
cd claude-flow

# Add local marketplace to Claude Code
/plugin marketplace add file://$(pwd)/plugins/marketplace

# Install the plugin
/plugin install claude-flow@claude-flow-plugin

# Verify installation
/plugin list
```

### Option 2: Direct from GitHub

```bash
# Add Loop's claude-flow marketplace
/plugin marketplace add https://raw.githubusercontent.com/looptech-ai/claude-flow/main/plugins/marketplace/marketplace.json

# Install the plugin
/plugin install claude-flow@claude-flow-plugin

# Or install latest
/plugin install claude-flow@looptech
```

### Option 3: Clone and Symlink (Active Development)

```bash
# Clone the repo
git clone https://github.com/looptech-ai/claude-flow.git

# Symlink to your project's .claude/plugins directory
ln -s $(pwd)/claude-flow/plugins/meta-orchestration ~/.claude/plugins/claude-flow-meta

# The plugin will be automatically available
```

## Requirements

- **Claude Code**: >= 1.0.0
- **claude-flow**: Installed globally (`npm install -g claude-flow@alpha`)
- **MCP Servers**: At least claude-flow MCP server configured

### Recommended MCP Servers

```bash
# Required
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Optional (enhances monitoring)
claude mcp add archon <your-archon-command>
claude mcp add context7 <your-context7-command>
claude mcp add linear-server <your-linear-command>
```

## Quick Start

### Start a Swarm with Monitoring

```
/swarm-start "Build REST API with JWT authentication"
```

This will:
1. Create workspace in `/tmp/swarm-<timestamp>/`
2. Start claude-flow swarm in background
3. Spawn intelligent monitoring agent
4. Provide real-time reports every 60 seconds

### Monitor Existing Swarm

```
/swarm-monitor /tmp/swarm-1730745000/
```

### Check Status

```
/swarm-status /tmp/swarm-1730745000/
```

## Components

### Agents

**swarm-monitor** - Production-ready monitoring agent with:
- 8 claude-flow monitoring MCP tools
- 4 Archon project/task tracking tools
- 2 Linear issue tracking tools
- 2 Context7 documentation tools
- File operations (Read, Glob, Grep, Bash)

### Skills

**swarm-orchestration** - Meta-orchestration patterns skill
- 4 verified supervision patterns
- Effectiveness ratings from production testing
- Quick reference guide included
- Auto-invoked when managing swarms

### Commands

- **swarm-start** - Automated swarm launch with monitoring
- **swarm-monitor** - Attach monitoring to running swarms
- **swarm-status** - Quick health and progress checks

## Testing & Verification

**Test Date**: November 4, 2025
**Test Swarm**: Todo REST API (156 lines, 5 CRUD endpoints)
**Results**:
- ✅ MCP tool access from Task agents verified
- ✅ Intelligent monitoring 9/10 effectiveness
- ✅ Architecture validation working
- ✅ Best practices compliance checking
- ✅ Code quality assessment accurate

## Documentation

- **Quick Reference**: `skills/swarm-orchestration/QUICK_REFERENCE.md`
- **Full Guide**: `skills/swarm-orchestration/SKILL.md`
- **Agent Spec**: `agents/swarm-monitor`

## Development

```bash
# Plugin structure
claude-flow-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── swarm-start.md
│   ├── swarm-monitor.md
│   └── swarm-status.md
├── agents/
│   └── swarm-monitor
├── skills/
│   └── swarm-orchestration/
│       ├── SKILL.md
│       └── QUICK_REFERENCE.md
└── README.md
```

## License

MIT - See LICENSE file

## Links

- **GitHub**: https://github.com/looptech-ai/claude-flow
- **Loop**: https://looptech.ai
- **Upstream**: https://github.com/ruvnet/claude-flow

## Support

For issues, questions, or contributions, please visit the GitHub repository.

---

**Made with ❤️ by Loop**
