# Quick Start - Claude Flow + Meta-Orchestration Plugin

> Complete setup from scratch in 5 minutes

## Prerequisites

- **Node.js 18+** and **npm 9+**
- **Git**

## 1. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

## 2. Clone & Install Claude Flow

```bash
# Clone the Loop-enhanced fork
git clone https://github.com/looptech-ai/claude-flow.git
cd claude-flow

# Checkout the feature branch (or main after merge)
git checkout feature/meta-orchestration-observability

# Install dependencies (use --legacy-peer-deps to handle TypeScript version conflicts)
npm install --legacy-peer-deps

# Build the project
npm run build

# Install globally
npm install -g .

# Verify
claude-flow --version
```

## 3. Configure MCP Servers

```bash
# Required: Claude Flow MCP
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Optional: Enhanced monitoring (if you have these)
claude mcp add archon <your-archon-command>
claude mcp add context7 <your-context7-command>
claude mcp add linear-server npx @linear/mcp-server

# Verify
claude mcp list
```

## 4. Install Meta-Orchestration Plugin

**IMPORTANT**: Make sure you're in the correct repository directory:
```bash
# Verify you're in the Loop-enhanced claude-flow repo
pwd
# Should show: .../looptech/claude_flow/claude-flow

# Add marketplace (use relative path from repo root)
/plugin marketplace add ./plugins/marketplace

# Install the plugin
/plugin install claude-flow@claude-flow-plugin

# Verify
/plugin list
# Should show: claude-flow@claude-flow-plugin (enabled)
```

**Troubleshooting**: If you see "Plugin directory not found", ensure:
1. You're in the correct claude-flow repository (not a different project)
2. The marketplace path is relative: `./plugins/marketplace`
3. The plugins/ directory exists with meta-orchestration/ inside it

## 5. Test Installation

```bash
# Test 1: Start a simple swarm with monitoring
/swarm-start "Create a hello.txt file with 'Hello World'"

# Test 2: Check if monitoring agent works
# The swarm-monitor agent should automatically track progress

# Test 3: Check status
/swarm-status
```

## Quick Usage

### Start a Swarm with Intelligent Monitoring
```bash
/swarm-start "Build REST API with authentication"
```

### Monitor Existing Swarm
```bash
/swarm-monitor /tmp/swarm-1730745000/
```

### Check Status
```bash
/swarm-status
```

## Troubleshooting

### npm install fails with ERESOLVE error
```bash
# Use legacy peer deps to bypass TypeScript version conflicts
npm install --legacy-peer-deps
npm run build
```

### Plugin Not Found
```bash
# Reinstall marketplace
/plugin marketplace remove claude-flow-plugin
/plugin marketplace add file://$(pwd)/plugins/marketplace
/plugin install claude-flow@claude-flow-plugin
```

### MCP Tools Not Working
```bash
# Restart MCP servers
claude mcp restart claude-flow
claude mcp list
```

### Commands Not Available
```bash
# Enable plugin
/plugin enable claude-flow@claude-flow-plugin

# Restart Claude Code
```

## What You Get

- ✅ **claude-flow**: Enterprise AI orchestration
- ✅ **3 Slash Commands**: /swarm-start, /swarm-monitor, /swarm-status
- ✅ **Intelligent Agent**: swarm-monitor (9/10 effectiveness)
- ✅ **20 MCP Tools**: Monitoring, validation, best practices
- ✅ **Auto-invoked Skill**: Meta-orchestration patterns

## Next Steps

- **Full Docs**: `plugins/meta-orchestration/README.md`
- **Installation Guide**: `plugins/meta-orchestration/INSTALLATION.md`
- **Quick Reference**: `plugins/meta-orchestration/skills/swarm-orchestration/QUICK_REFERENCE.md`

## Support

- **GitHub**: https://github.com/looptech-ai/claude-flow
- **Loop**: https://looptech.ai

---

**Total Setup Time**: ~5 minutes | **Made with ❤️ by Loop**
