# MCP Tool Scoping Configuration for Claude-Flow Subagents

## Overview

This document defines which MCP server tools should be accessible to different types of agents in the Claude-Flow orchestration system. Proper tool scoping ensures agents have access to the tools they need while preventing inappropriate tool usage.

## Architectural Principle

**Role-Based Tool Access**: Assign tools based on agent responsibility level and function.

- **Orchestrators/Managers**: High-level coordination tools (Linear, Archon projects, swarm status)
- **Implementation Agents**: Code-focused tools (Context7, code examples, documentation)
- **Monitoring Agents**: Observability tools (metrics, logs, status checks)
- **All Agents**: Basic file operations and bash commands

## Tool Categories

### 1. Orchestrator Tools (Coordination & Management)

**Purpose**: Project management, issue tracking, high-level coordination

**Agent Types**:
- `coordinator`
- `hierarchical-coordinator`
- `mesh-coordinator`
- `adaptive-coordinator`
- `swarm-memory-manager`
- `hive-monitor-specialized`
- `project-manager`

**Allowed Tools**:
```typescript
const ORCHESTRATOR_TOOLS = [
  // Linear - Issue tracking
  "mcp__linear-server__list_issues",
  "mcp__linear-server__get_issue",
  "mcp__linear-server__update_issue",
  "mcp__linear-server__create_issue",
  "mcp__linear-server__create_comment",
  "mcp__linear-server__list_projects",
  "mcp__linear-server__get_project",
  "mcp__linear-server__list_teams",
  "mcp__linear-server__get_team",

  // Archon - Project management
  "mcp__archon__find_projects",
  "mcp__archon__manage_project",
  "mcp__archon__find_tasks",
  "mcp__archon__manage_task",
  "mcp__archon__find_documents",
  "mcp__archon__manage_document",
  "mcp__archon__get_project_features",
  "mcp__archon__find_versions",

  // Claude Flow - Swarm coordination
  "mcp__claude-flow__swarm_init",
  "mcp__claude-flow__swarm_status",
  "mcp__claude-flow__agent_spawn",
  "mcp__claude-flow__agent_list",
  "mcp__claude-flow__agent_metrics",
  "mcp__claude-flow__task_orchestrate",
  "mcp__claude-flow__task_status",
  "mcp__claude-flow__task_results",
  "mcp__claude-flow__memory_usage",
  "mcp__claude-flow__swarm_monitor",

  // File operations
  "Read", "Glob", "Grep", "Bash"
];
```

**Rationale**: Orchestrators need visibility into project status, team coordination, and swarm health. They make high-level decisions and delegate to implementation agents.

### 2. Implementation Tools (Code & Documentation)

**Purpose**: Writing code, searching documentation, finding best practices

**Agent Types**:
- `coder`
- `researcher`
- `backend-dev`
- `mobile-dev`
- `ml-developer`
- `sparc-coder`
- `api-docs`
- `code-analyzer`

**Allowed Tools**:
```typescript
const IMPLEMENTATION_TOOLS = [
  // Context7 - Library documentation
  "mcp__context7__resolve-library-id",
  "mcp__context7__get-library-docs",

  // Archon - Code examples & knowledge
  "mcp__archon__rag_search_code_examples",
  "mcp__archon__rag_search_knowledge_base",

  // Microsoft Docs - Azure/TypeScript/Framework docs
  "mcp__microsoft_docs_mcp__microsoft_docs_search",
  "mcp__microsoft_docs_mcp__microsoft_code_sample_search",
  "mcp__microsoft_docs_mcp__microsoft_docs_fetch",

  // Azure MCP - Best practices (code-related only)
  "mcp__azure-mcp-server__get_bestpractices",
  "mcp__azure-mcp-server__azureterraformbestpractices",
  "mcp__azure-mcp-server__bicepschema",

  // Claude Flow - Memory for coordination
  "mcp__claude-flow__memory_usage",
  "mcp__claude-flow__memory_search",

  // File operations
  "Read", "Write", "Edit", "Glob", "Grep", "Bash"
];
```

**Rationale**: Implementation agents need access to documentation, code examples, and best practices to write high-quality code. They don't need project management tools but should coordinate via memory.

### 3. Testing Tools

**Purpose**: Writing tests, validation, quality assurance

**Agent Types**:
- `tester`
- `reviewer`
- `tdd-london-swarm`
- `production-validator`

**Allowed Tools**:
```typescript
const TESTING_TOOLS = [
  // Context7 - Testing framework docs
  "mcp__context7__resolve-library-id",
  "mcp__context7__get-library-docs",

  // Archon - Test examples
  "mcp__archon__rag_search_code_examples",
  "mcp__archon__rag_search_knowledge_base",

  // Microsoft Docs - Testing patterns
  "mcp__microsoft_docs_mcp__microsoft_docs_search",
  "mcp__microsoft_docs_mcp__microsoft_code_sample_search",

  // Azure MCP - Load testing
  "mcp__azure-mcp-server__loadtesting",

  // Claude Flow - Task coordination
  "mcp__claude-flow__memory_usage",
  "mcp__claude-flow__task_status",

  // File operations
  "Read", "Write", "Edit", "Glob", "Grep", "Bash"
];
```

**Rationale**: Testers need documentation for testing frameworks and access to code examples for test patterns. They also need task coordination to understand what to test.

### 4. Monitoring Tools

**Purpose**: Observability, metrics, status tracking

**Agent Types**:
- `hive-monitor-specialized`
- `perf-analyzer`
- `performance-benchmarker`
- `monitor`

**Allowed Tools**:
```typescript
const MONITORING_TOOLS = [
  // Linear - Progress updates
  "mcp__linear-server__get_issue",
  "mcp__linear-server__create_comment",

  // Archon - Project status
  "mcp__archon__find_tasks",
  "mcp__archon__find_projects",
  "mcp__archon__get_project_features",

  // Claude Flow - Swarm metrics
  "mcp__claude-flow__swarm_status",
  "mcp__claude-flow__agent_list",
  "mcp__claude-flow__agent_metrics",
  "mcp__claude-flow__task_status",
  "mcp__claude-flow__task_results",
  "mcp__claude-flow__performance_report",
  "mcp__claude-flow__bottleneck_analyze",
  "mcp__claude-flow__swarm_monitor",
  "mcp__claude-flow__memory_analytics",
  "mcp__claude-flow__metrics_collect",
  "mcp__claude-flow__health_check",

  // Azure MCP - Resource monitoring
  "mcp__azure-mcp-server__monitor",
  "mcp__azure-mcp-server__resourcehealth",
  "mcp__azure-mcp-server__applicationinsights",

  // File operations (read-only focus)
  "Read", "Glob", "Grep", "Bash"
];
```

**Rationale**: Monitors need comprehensive observability tools to track swarm health, report progress, and identify issues. They should update Linear/Archon but not make major project decisions.

### 5. Architecture Tools

**Purpose**: System design, architecture decisions, pattern validation

**Agent Types**:
- `system-architect`
- `architecture`
- `repo-architect`

**Allowed Tools**:
```typescript
const ARCHITECTURE_TOOLS = [
  // Context7 - Architecture patterns
  "mcp__context7__resolve-library-id",
  "mcp__context7__get-library-docs",

  // Archon - Project architecture
  "mcp__archon__find_projects",
  "mcp__archon__find_documents",
  "mcp__archon__get_project_features",
  "mcp__archon__rag_search_knowledge_base",

  // Microsoft Docs - Architecture guidance
  "mcp__microsoft_docs_mcp__microsoft_docs_search",
  "mcp__microsoft_docs_mcp__microsoft_docs_fetch",

  // Azure MCP - Cloud architecture
  "mcp__azure-mcp-server__cloudarchitect",
  "mcp__azure-mcp-server__get_bestpractices",
  "mcp__azure-mcp-server__deploy",

  // Claude Flow - Topology design
  "mcp__claude-flow__topology_optimize",
  "mcp__claude-flow__features_detect",

  // File operations
  "Read", "Write", "Edit", "Glob", "Grep", "Bash"
];
```

**Rationale**: Architects need access to patterns, best practices, and project context to make informed design decisions.

### 6. DevOps Tools

**Purpose**: Deployment, infrastructure, CI/CD

**Agent Types**:
- `cicd-engineer`
- `workflow-automation`
- `release-manager`

**Allowed Tools**:
```typescript
const DEVOPS_TOOLS = [
  // Azure MCP - Deployment & infrastructure
  "mcp__azure-mcp-server__azd",
  "mcp__azure-mcp-server__deploy",
  "mcp__azure-mcp-server__aks",
  "mcp__azure-mcp-server__appservice",
  "mcp__azure-mcp-server__functionapp",
  "mcp__azure-mcp-server__storage",
  "mcp__azure-mcp-server__keyvault",
  "mcp__azure-mcp-server__get_bestpractices",

  // Microsoft Docs - Azure deployment
  "mcp__microsoft_docs_mcp__microsoft_docs_search",
  "mcp__microsoft_docs_mcp__microsoft_code_sample_search",

  // Context7 - CI/CD tool docs
  "mcp__context7__resolve-library-id",
  "mcp__context7__get-library-docs",

  // Claude Flow - Pipeline automation
  "mcp__claude-flow__pipeline_create",
  "mcp__claude-flow__workflow_execute",
  "mcp__claude-flow__automation_setup",

  // GitHub (if applicable)
  "mcp__claude-flow__github_workflow_auto",
  "mcp__claude-flow__github_release_coord",

  // File operations
  "Read", "Write", "Edit", "Glob", "Grep", "Bash"
];
```

**Rationale**: DevOps agents need infrastructure management, deployment, and automation tools to handle CI/CD and cloud operations.

### 7. GitHub Tools

**Purpose**: Repository management, PRs, issues, code review

**Agent Types**:
- `pr-manager`
- `code-review-swarm`
- `issue-tracker`
- `release-manager`
- `github-modes`

**Allowed Tools**:
```typescript
const GITHUB_TOOLS = [
  // Linear - Issue sync
  "mcp__linear-server__list_issues",
  "mcp__linear-server__get_issue",
  "mcp__linear-server__create_issue",
  "mcp__linear-server__update_issue",

  // Claude Flow - GitHub integration
  "mcp__claude-flow__github_repo_analyze",
  "mcp__claude-flow__github_pr_manage",
  "mcp__claude-flow__github_issue_track",
  "mcp__claude-flow__github_release_coord",
  "mcp__claude-flow__github_workflow_auto",
  "mcp__claude-flow__github_code_review",
  "mcp__claude-flow__github_sync_coord",
  "mcp__claude-flow__github_metrics",

  // Archon - Documentation
  "mcp__archon__find_documents",
  "mcp__archon__manage_document",

  // File operations
  "Read", "Glob", "Grep", "Bash"
];
```

**Rationale**: GitHub agents need repository tools and should sync with Linear for issue tracking.

## Implementation in Claude-Flow

### Tool Filtering Architecture

Add to `src/core/ToolFilter.ts`:

```typescript
/**
 * ToolFilter - Filters MCP tools based on agent type and role
 */

import { AgentType } from './AgentRegistry.js';

export interface ToolAccessConfig {
  agentTypes: AgentType[];
  allowedTools: string[];
  description: string;
}

export class ToolFilter {
  private static readonly TOOL_CONFIGS: ToolAccessConfig[] = [
    {
      agentTypes: [
        'coordinator', 'hierarchical-coordinator', 'mesh-coordinator',
        'adaptive-coordinator', 'swarm-memory-manager', 'hive-monitor-specialized'
      ],
      allowedTools: ORCHESTRATOR_TOOLS,
      description: 'Orchestration and coordination tools'
    },
    {
      agentTypes: [
        'coder', 'researcher', 'backend-dev', 'mobile-dev',
        'ml-developer', 'sparc-coder', 'api-docs', 'code-analyzer'
      ],
      allowedTools: IMPLEMENTATION_TOOLS,
      description: 'Implementation and documentation tools'
    },
    {
      agentTypes: ['tester', 'reviewer', 'tdd-london-swarm', 'production-validator'],
      allowedTools: TESTING_TOOLS,
      description: 'Testing and validation tools'
    },
    {
      agentTypes: ['hive-monitor-specialized', 'perf-analyzer', 'performance-benchmarker', 'monitor'],
      allowedTools: MONITORING_TOOLS,
      description: 'Monitoring and observability tools'
    },
    {
      agentTypes: ['system-architect', 'architecture', 'repo-architect'],
      allowedTools: ARCHITECTURE_TOOLS,
      description: 'Architecture and design tools'
    },
    {
      agentTypes: ['cicd-engineer', 'workflow-automation', 'release-manager'],
      allowedTools: DEVOPS_TOOLS,
      description: 'DevOps and deployment tools'
    },
    {
      agentTypes: ['pr-manager', 'code-review-swarm', 'issue-tracker', 'release-manager', 'github-modes'],
      allowedTools: GITHUB_TOOLS,
      description: 'GitHub integration tools'
    }
  ];

  /**
   * Get allowed tools for an agent type
   */
  static getAllowedTools(agentType: AgentType): string[] {
    const matchingConfigs = this.TOOL_CONFIGS.filter(config =>
      config.agentTypes.includes(agentType)
    );

    if (matchingConfigs.length === 0) {
      // Default: basic file operations only
      return ['Read', 'Glob', 'Grep', 'Bash'];
    }

    // Merge all matching tool sets (agent may belong to multiple categories)
    const tools = new Set<string>();
    matchingConfigs.forEach(config => {
      config.allowedTools.forEach(tool => tools.add(tool));
    });

    return Array.from(tools);
  }

  /**
   * Check if agent can use a specific tool
   */
  static canUseTool(agentType: AgentType, toolName: string): boolean {
    const allowedTools = this.getAllowedTools(agentType);
    return allowedTools.includes(toolName);
  }

  /**
   * Filter MCP tool list for agent
   */
  static filterTools(agentType: AgentType, availableTools: string[]): string[] {
    const allowedTools = this.getAllowedTools(agentType);
    return availableTools.filter(tool => allowedTools.includes(tool));
  }
}
```

### Usage in Agent Spawning

Update `src/core/AgentRegistry.ts`:

```typescript
async spawn(type: AgentType, config: AgentConfig = {}): Promise<Agent> {
  // ... existing code ...

  // Add tool filtering
  const allowedTools = ToolFilter.getAllowedTools(type);

  const agent: Agent = {
    // ... existing properties ...
    allowedTools,  // NEW: Add to agent metadata
    metadata: {
      ...config.metadata,
      toolAccess: ToolFilter.TOOL_CONFIGS.find(c => c.agentTypes.includes(type))?.description || 'Basic tools'
    }
  };

  return agent;
}
```

### MCP Server Tool Invocation

Add tool validation before invoking MCP tools:

```typescript
async invokeMCPTool(agentId: string, toolName: string, params: any): Promise<any> {
  const agent = this.agents.get(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  // Validate tool access
  if (!ToolFilter.canUseTool(agent.type, toolName)) {
    throw new Error(
      `Agent type '${agent.type}' is not authorized to use tool '${toolName}'. ` +
      `Allowed tools: ${agent.allowedTools?.join(', ')}`
    );
  }

  // Invoke tool...
}
```

## Security Considerations

1. **Principle of Least Privilege**: Agents only get tools they need for their role
2. **No Privilege Escalation**: Implementation agents can't modify project plans
3. **Audit Logging**: Log all MCP tool invocations with agent ID and timestamp
4. **Tool Usage Monitoring**: Track which agents use which tools for anomaly detection

## Configuration Override

Allow users to override tool scoping via configuration:

```json
{
  "toolScoping": {
    "enabled": true,
    "customRules": [
      {
        "agentType": "custom-agent",
        "allowedTools": ["Read", "Write", "mcp__linear-server__get_issue"]
      }
    ],
    "disableFiltering": false
  }
}
```

## Future Enhancements

1. **Dynamic Tool Discovery**: Auto-detect available MCP tools and categorize
2. **Role-Based Access Control (RBAC)**: Fine-grained permissions per user/team
3. **Tool Usage Analytics**: Track which tools are most used by which agent types
4. **Smart Tool Suggestions**: Recommend tools based on agent task and context

---

**Version**: 1.0.0
**Last Updated**: 2025-11-04
**Status**: Production-ready specification
