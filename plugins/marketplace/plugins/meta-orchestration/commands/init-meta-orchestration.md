---
name: init-meta-orchestration
description: Initialize or update CLAUDE.md with meta-orchestration guidance
---

# Initialize Meta-Orchestration

Create or update the CLAUDE.md file with comprehensive meta-orchestration guidance.

## Instructions

1. **Install swarm-monitor agent to local .claude/agents/**:
   ```javascript
   // First, read the plugin's swarm-monitor agent
   const agentContent = Read("plugins/marketplace/plugins/meta-orchestration/agents/swarm-monitor")

   // Create .claude/agents directory if it doesn't exist
   Bash("mkdir -p .claude/agents")

   // Write the agent to local .claude/agents/
   Write(".claude/agents/swarm-monitor", agentContent)

   // Inform user
   console.log("✅ Installed swarm-monitor agent to .claude/agents/swarm-monitor")
   ```

2. **Add swarm logs to .gitignore**:
   ```javascript
   // Read existing .gitignore or create empty string
   let gitignore = ""
   try {
     gitignore = Read(".gitignore")
   } catch {
     gitignore = ""
   }

   // Add swarm log patterns if not already present
   const swarmPatterns = `
# Claude-flow swarm logs
swarm.log
.claude-flow/
.hive-mind/
/tmp/swarm-*/
*.swarm.log
`

   if (!gitignore.includes("swarm.log")) {
     Write(".gitignore", gitignore + swarmPatterns)
     console.log("✅ Added swarm log patterns to .gitignore")
   } else {
     console.log("ℹ️  Swarm patterns already in .gitignore")
   }
   ```

3. **Check for existing CLAUDE.md**:
   ```javascript
   Read("CLAUDE.md")  // If exists, we'll append/update. If not, create new.
   ```

4. **Create/Update CLAUDE.md** with this content:

```markdown
# Meta-Orchestration Guidelines

## CRITICAL: Always Delegate, Never Work Directly

When completing tasks in this repository, you MUST follow meta-orchestration patterns:

### Golden Rules

1. **ALWAYS DELEGATE** - Never use Edit/Write/Bash directly for implementation
2. **SPAWN IN CURRENT DIRECTORY** - All subagents work in `${process.cwd()}` unless using GitTree
3. **REVIEW BEFORE ACCEPTING** - Use specialized review subagents to validate work
4. **ENSURE SPEC ALIGNMENT** - Every implementation must align with requirements

### Task Completion Workflow

#### Phase 1: Start Execution Swarm
```bash
# Start claude-flow swarm to do the actual work
Bash("claude-flow swarm 'Complete task: [description]' --background > swarm.log 2>&1 &")
```

#### Phase 2: Spawn Monitoring Subagent
```javascript
// Use specialized swarm-monitor in CURRENT DIRECTORY
Task("Monitor Progress", `
Monitor swarm execution in ${process.cwd()}

**IMPORTANT**: Work in current directory: ${process.cwd()}
Do NOT change directories unless explicitly using GitTree.

**USE MCP TOOLS**:
- mcp__claude-flow__swarm_status() - Health
- mcp__archon__find_tasks() - Progress
- mcp__context7__get-library-docs() - Validation

**ANALYZE FILES**:
- Read files created in ${process.cwd()}
- Understand their purpose
- Validate architecture

**REPORT EVERY 2 MINUTES**:
1. What was built and why
2. Architecture validation
3. Best practices compliance
`, "swarm-monitor")
```

#### Phase 3: Spawn Review Subagent
```javascript
// After swarm completes, spawn reviewer in CURRENT DIRECTORY
Task("Review Implementation", `
Review the implementation in ${process.cwd()}

**IMPORTANT**: Work in current directory: ${process.cwd()}
All files to review are in this directory tree.

**REVIEW CHECKLIST**:
- Does implementation match requirements?
- Are best practices followed?
- Is error handling proper?
- Is code quality acceptable?
- Are tests sufficient?

**DELIVERABLE**:
Provide detailed review report with:
- What aligns with spec ✓
- What needs adjustment ✗
- Specific recommendations
`, "reviewer")
```

#### Phase 4: Act on Review
```javascript
// If review found issues, delegate fixes (don't fix directly!)
if (reviewFoundIssues) {
  Task("Fix Issues", `
  Address these issues found in review:
  [list specific issues]

  Work in ${process.cwd()}
  `, "coder")
}
```

### Directory Constraints ⚠️

**CRITICAL**: All subagents MUST work in the current directory unless using GitTree:

```javascript
// ✅ CORRECT: Subagent works in current directory
Task("Build Feature", `
Implement feature X in ${process.cwd()}

All files are in the current directory tree.
Do NOT cd to other directories.
`, "coder")

// ❌ WRONG: Don't spawn agents that work elsewhere
Task("Build Feature", `
Go to /tmp and build something...  // NO!
`, "coder")

// ✅ EXCEPTION: Using GitTree is OK
Task("Analyze Dependency", `
Use GitTree to analyze external repo:
/path/to/other/repo

After analysis, return to ${process.cwd()}
`, "researcher")
```

### Never Work Directly ⚠️

After starting a swarm or spawning subagents, you are an **ORCHESTRATOR**, not a **WORKER**.

**DO NOT**:
- ❌ Use Edit() to modify code
- ❌ Use Write() to create files
- ❌ Use Bash() for implementation commands
- ❌ Work in directories outside ${process.cwd()}

**DO**:
- ✅ Use Task() to spawn subagents
- ✅ Constrain subagents to ${process.cwd()}
- ✅ Use MCP tools to monitor
- ✅ Review subagent outputs
- ✅ Delegate follow-up work

### Review Before Accepting

**ALWAYS** spawn a review subagent before considering work complete:

```javascript
Task("Final Review", `
Review all work in ${process.cwd()} for:

**Spec Alignment**:
- Matches requirements exactly
- All acceptance criteria met
- Edge cases handled

**Code Quality**:
- Best practices followed
- Error handling proper
- Tests comprehensive
- Documentation clear

**Architecture**:
- Patterns appropriate
- Dependencies minimal
- Performance acceptable

Provide GO/NO-GO decision with specific justification.
`, "reviewer")
```

### Ensuring Spec Alignment

Before accepting any implementation:

1. **Spawn Spec Validator**:
   ```javascript
   Task("Validate Spec", `
   Compare implementation in ${process.cwd()} against spec:
   [paste spec here]

   Report any deviations or gaps.
   `, "reviewer")
   ```

2. **Review validation report**
3. **Delegate fixes** if needed (don't fix directly!)
4. **Re-validate** until aligned

### Summary Checklist

Before marking task complete, verify:

- [ ] Started execution swarm (CLI)
- [ ] Spawned monitor subagent in ${process.cwd()}
- [ ] Let swarm complete (no direct work!)
- [ ] Spawned review subagent in ${process.cwd()}
- [ ] Validated spec alignment
- [ ] Delegated any fixes (no direct fixes!)
- [ ] Re-reviewed until approved
- [ ] All work stayed in ${process.cwd()} (unless GitTree)

---

**Remember**: You orchestrate, you don't implement. Delegate everything!
```

5. **Inform user**:
   ```
   ✅ Meta-orchestration initialization complete!

   What was set up:
   1. ✅ Installed swarm-monitor agent to .claude/agents/swarm-monitor
   2. ✅ Added swarm log patterns to .gitignore
   3. ✅ Created/updated CLAUDE.md with meta-orchestration guidelines

   The swarm-monitor agent is now:
   - Part of your repository (.claude/agents/)
   - Available to all Claude sessions
   - Can be customized for this project
   - Will work even if plugin is uninstalled

   Swarm logs will be ignored:
   - swarm.log
   - .claude-flow/
   - .hive-mind/
   - /tmp/swarm-*/
   - *.swarm.log

   CLAUDE.md will guide all Claude sessions to:
   - Always delegate, never work directly
   - Spawn subagents in current directory
   - Use review subagents to ensure spec alignment
   - Exception: GitTree usage allows external directories
   ```

## Important Notes

- The swarm-monitor agent is copied from the plugin to your local `.claude/agents/`
- If CLAUDE.md exists, append meta-orchestration section with clear header
- If it doesn't exist, create it with the full content
- Make sure to replace `${process.cwd()}` with the actual current directory path
- Swarm log patterns are added to `.gitignore` (or created if doesn't exist)
- ALL subagents work in the current directory unless using GitTree
