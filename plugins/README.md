# Claude Flow Plugins

This directory contains Claude Code plugins for enhanced claude-flow functionality.

## Available Plugins

### Meta-Orchestration Plugin

**Location**: `plugins/meta-orchestration/`

Intelligent swarm orchestration and monitoring for claude-flow with MCP tool integration.

**Features**:
- 🤖 Intelligent monitoring agent (9/10 effectiveness)
- 📋 3 slash commands (/swarm-start, /swarm-monitor, /swarm-status)
- 🧠 Auto-invoked meta-orchestration skill
- 🔧 20 monitoring-specific MCP tools

**Installation**:

```bash
# Option 1: Local marketplace (development)
cd /path/to/claude-flow
/plugin marketplace add file://$(pwd)/plugins/marketplace
/plugin install claude-flow@claude-flow-plugin

# Option 2: Direct from repo (coming soon)
/plugin marketplace add https://raw.githubusercontent.com/looptech-ai/claude-flow/main/plugins/marketplace/marketplace.json
/plugin install claude-flow@looptech
```

**Quick Start**:

```bash
# Start a swarm with intelligent monitoring
/swarm-start "Build REST API with authentication"

# Monitor existing swarm
/swarm-monitor /tmp/swarm-1730745000/

# Check status
/swarm-status
```

See `meta-orchestration/README.md` for full documentation.

## Development

### Creating New Plugins

Follow the structure:

```
plugins/
├── your-plugin-name/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── commands/           # Optional
│   ├── agents/            # Optional
│   ├── skills/            # Optional
│   └── README.md
└── marketplace/
    └── marketplace.json    # Add your plugin here
```

### Testing Locally

1. Add plugin to `marketplace/marketplace.json`
2. Install via local marketplace
3. Test commands and agents
4. Commit when verified

## Contributing

We welcome plugin contributions! Please:

1. Follow the plugin structure above
2. Include comprehensive README
3. Test thoroughly before submitting PR
4. Add entry to marketplace.json

## License

MIT - See LICENSE file in root directory
