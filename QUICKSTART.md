# Claude Flow - Quick Install

> Complete setup in 5 minutes

## Prerequisites

- **Node.js 18+** and **npm 9+**
- **Git**
- **Claude Code** installed

## 1. Install Claude Code (if needed)

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

## 2. Clone & Install Claude Flow

```bash
# Clone the Loop-enhanced fork
git clone https://github.com/looptech-ai/claude-flow.git
cd claude-flow

# Install dependencies
npm install --legacy-peer-deps

# Build the project
npm run build

# Install globally
npm install -g .

# Verify
claude-flow --version
```

## 3. Configure MCP Server

```bash
# Required: Claude Flow MCP
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Verify
claude mcp list
```

## 4. Install Claude-Flow Plugin

From inside the claude-flow directory:

```bash
# Verify you're in the claude-flow repo
pwd
# Should show: .../claude-flow

# Install as local plugin
/plugin add ./

# Verify installation
/plugin list
# Should show: claude-flow (enabled)

# Check available agents
/agents
# Should list: clerk (and many others)

# Check available commands
/help
# Should show: /swarm-start, /swarm-status
```

## 5. Quick Test

```bash
# Show orchestration patterns
"Help me build a REST API with swarm"

# You'll see a menu of 4 patterns:
# 1. Quick Swarm
# 2. Hive-Mind
# 3. Background Swarm
# 4. SPARC TDD
```

## Usage Example

```bash
# Start a swarm with clerk monitoring
/swarm-start "Build calculator API"

# Check status
/swarm-status
```

## What You Get

✅ **2 Slash Commands**:
- `/swarm-start` - Start swarm with clerk monitoring
- `/swarm-status` - Check status with MCP tools

✅ **Clerk Agent**:
- View with: `/agents`
- Use with: `Task("Observer", "Monitor swarm...", "clerk")`

✅ **Auto-invoked Skill**:
- Shows pattern menu automatically
- Simple 4-step workflow

✅ **74+ Existing Agents**:
- Core: coder, reviewer, tester, planner, researcher
- Swarm: hierarchical-coordinator, mesh-coordinator, adaptive-coordinator
- GitHub: pr-manager, code-review-swarm, issue-tracker
- And many more!

## Troubleshooting

### npm install fails
```bash
npm install --legacy-peer-deps
npm run build
```

### Plugin not found
```bash
# Make sure you're in claude-flow directory
pwd

# Reinstall
/plugin remove claude-flow
/plugin add ./
```

### Clerk agent not visible
```bash
# Verify plugin is enabled
/plugin list

# Check agents list
/agents
# Clerk should appear in the list
```

## Total Setup Time: ~5 minutes

**Made with ❤️ by Loop** (https://looptech.ai)
