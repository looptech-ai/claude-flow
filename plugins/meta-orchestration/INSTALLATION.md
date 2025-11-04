# Installation Guide - Claude Flow Meta-Orchestration Plugin

Complete installation guide for the claude-flow meta-orchestration plugin with troubleshooting.

## Prerequisites

Before installing the plugin, ensure you have:

### Required
- **Claude Code**: v1.0.0 or higher
- **claude-flow**: Installed globally
- **Git**: For cloning the repository

### Recommended MCP Servers
- **claude-flow MCP**: Required for monitoring tools
- **Archon**: Optional - project/task tracking
- **Context7**: Optional - documentation integration
- **Linear**: Optional - issue tracking

## Installation Methods

### Method 1: Local Development (Recommended)

Best for active development or contributing to the plugin.

```bash
# 1. Clone the claude-flow repository
git clone https://github.com/looptech-ai/claude-flow.git
cd claude-flow

# 2. Verify plugin structure
ls -la plugins/meta-orchestration/

# 3. Add local marketplace to Claude Code
/plugin marketplace add file://$(pwd)/plugins/marketplace

# 4. Install the plugin
/plugin install claude-flow@claude-flow-plugin

# 5. Verify installation
/plugin list
# Should show: claude-flow@claude-flow-plugin (enabled)
```

### Method 2: Direct from GitHub

For production use without local development.

```bash
# 1. Add Loop's marketplace
/plugin marketplace add https://raw.githubusercontent.com/looptech-ai/claude-flow/main/plugins/marketplace/marketplace.json

# 2. Install the plugin
/plugin install claude-flow@claude-flow-plugin

# 3. Verify
/plugin list
```

### Method 3: Symlink (Active Plugin Development)

For developing the plugin itself.

```bash
# 1. Clone repo
git clone https://github.com/looptech-ai/claude-flow.git
cd claude-flow

# 2. Create symlink in Claude Code plugins directory
mkdir -p ~/.claude/plugins
ln -s $(pwd)/plugins/meta-orchestration ~/.claude/plugins/claude-flow-meta

# 3. Verify (restart Claude Code may be needed)
/plugin list
```

## MCP Server Setup

### Required: Claude Flow MCP Server

```bash
# Add claude-flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Verify
claude mcp list
```

### Optional: Enhanced Monitoring

```bash
# Archon (project/task management)
claude mcp add archon <your-archon-command>

# Context7 (documentation)
claude mcp add context7 <your-context7-command>

# Linear (issue tracking)
claude mcp add linear-server npx @linear/mcp-server

# Verify all
claude mcp list
```

## Verification

### Test Plugin Installation

```bash
# 1. Check if plugin is enabled
/plugin list

# 2. Test swarm-monitor agent exists
# In Claude Code, try:
Task("test", "Quick test", "swarm-monitor")
# Should not error about unknown agent type

# 3. Check for swarm-orchestration skill
# The skill should auto-activate when you mention swarms
```

### Test Commands

```bash
# Test slash commands are available
/swarm  # Should show autocomplete

# Commands should be available:
# - /swarm-start
# - /swarm-monitor
# - /swarm-status
```

### Test MCP Tool Access

Create a simple test to verify MCP tools are accessible:

```bash
# Start a minimal swarm
/swarm-start "Create hello.txt with 'Hello World'"

# Monitor should automatically spawn and use MCP tools:
# - mcp__claude-flow__swarm_status
# - mcp__claude-flow__agent_list
```

## Troubleshooting

### Plugin Not Found

**Symptom**: `/plugin install claude-flow@claude-flow-plugin` fails with "not found"

**Solutions**:
1. Verify marketplace was added:
   ```bash
   /plugin marketplace list
   ```

2. Re-add marketplace:
   ```bash
   /plugin marketplace remove claude-flow-plugin
   /plugin marketplace add file://$(pwd)/plugins/marketplace
   ```

3. Check marketplace.json exists:
   ```bash
   ls -la plugins/marketplace/marketplace.json
   ```

### Commands Not Available

**Symptom**: `/swarm-start` command not found

**Solutions**:
1. Verify plugin is enabled:
   ```bash
   /plugin list
   # Should show: claude-flow@claude-flow-plugin (enabled)
   ```

2. Enable the plugin:
   ```bash
   /plugin enable claude-flow@claude-flow-plugin
   ```

3. Restart Claude Code

### swarm-monitor Agent Not Found

**Symptom**: `Task("test", "test", "swarm-monitor")` errors

**Solutions**:
1. Check agent file exists:
   ```bash
   cat plugins/meta-orchestration/agents/swarm-monitor | head -10
   # Should show YAML frontmatter
   ```

2. Verify YAML frontmatter is valid:
   - Must start with `---`
   - Must have `name:`, `description:`, `tools:`, `model:`
   - Must end with `---`

3. Reinstall plugin:
   ```bash
   /plugin uninstall claude-flow@claude-flow-plugin
   /plugin install claude-flow@claude-flow-plugin
   ```

### MCP Tools Not Working

**Symptom**: Monitor agent can't access `mcp__claude-flow__*` tools

**Solutions**:
1. Verify MCP servers are running:
   ```bash
   claude mcp list
   # Should show: claude-flow (running)
   ```

2. Restart MCP servers:
   ```bash
   claude mcp restart claude-flow
   ```

3. Check tool access in main Claude Code session:
   ```bash
   # Try calling an MCP tool directly
   mcp__claude-flow__swarm_status()
   ```

### Skill Not Auto-Activating

**Symptom**: swarm-orchestration skill doesn't activate when needed

**Solutions**:
1. Check skill file has frontmatter:
   ```bash
   head -5 plugins/meta-orchestration/skills/swarm-orchestration/SKILL.md
   # Should show:
   # ---
   # name: swarm-orchestration
   # description: ...
   ```

2. Verify description is specific:
   - Should mention "swarm", "orchestration", "monitoring"
   - Should describe when to use it

3. Force invoke skill by mentioning keywords:
   - "monitor the swarm"
   - "orchestrate claude-flow"
   - "meta-orchestration patterns"

## Uninstallation

```bash
# Disable plugin
/plugin disable claude-flow@claude-flow-plugin

# Uninstall plugin
/plugin uninstall claude-flow@claude-flow-plugin

# Remove marketplace
/plugin marketplace remove claude-flow-plugin

# Remove symlink (if used Method 3)
rm ~/.claude/plugins/claude-flow-meta
```

## Upgrade

```bash
# Pull latest from git
cd claude-flow
git pull origin main

# Reinstall plugin
/plugin uninstall claude-flow@claude-flow-plugin
/plugin install claude-flow@claude-flow-plugin

# Verify new version
/plugin list
```

## Getting Help

If you encounter issues:

1. **Check logs**: Look in Claude Code's developer console for errors
2. **GitHub Issues**: https://github.com/looptech-ai/claude-flow/issues
3. **Discord**: Join the Loop community
4. **Documentation**: See `plugins/meta-orchestration/README.md`

## Next Steps

After successful installation:

1. **Read Quick Reference**: `plugins/meta-orchestration/skills/swarm-orchestration/QUICK_REFERENCE.md`
2. **Try a Test Swarm**: `/swarm-start "Create a simple calculator API"`
3. **Explore Commands**: Type `/swarm` and see autocomplete
4. **Learn Patterns**: Read the full SKILL.md for meta-orchestration patterns

---

**Made with ❤️ by Loop** | https://looptech.ai
