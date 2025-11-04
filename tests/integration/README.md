# Integration Tests for Meta-Orchestration

This directory contains comprehensive integration tests for the meta-orchestration observability system in Claude Flow.

## Overview

The meta-orchestration system enables supervisor Claude agents to monitor and coordinate worker swarms in real-time. Tests are written in Test-Driven Development (TDD) style, defining the expected behavior before implementation.

## Test Files

### 1. event-stream.test.ts

Tests for **EventStreamManager** - the core event streaming system.

**Coverage:**
- Event file creation and initialization
- Event capture and buffering
- Auto-flush mechanisms
- JSONL format compliance
- Error handling
- Cleanup and graceful shutdown

**Key Test Cases:**
```typescript
- should create event file on start
- should capture and write events
- should buffer events and flush periodically
- should auto-flush when buffer is full
- should handle file write errors gracefully
- should flush on stop
```

**Coverage Target:** 95%

**Run:**
```bash
npm test -- tests/integration/event-stream.test.ts
```

### 2. observability-tools.test.ts

Tests for **MCP Observability Tools** - the three key monitoring tools.

**Tools Tested:**
1. `swarm/monitor` - Tail and filter recent events
2. `swarm/message` - Send messages to agents
3. `swarm/query_events` - Query events with filters and aggregations

**Key Test Cases:**
```typescript
// swarm/monitor
- should tail recent events
- should filter events by type
- should format output correctly (json/text/summary)
- should handle missing event file

// swarm/message
- should send message to specific agent
- should broadcast to all agents
- should append multiple messages

// swarm/query_events
- should filter by event types
- should filter by agent ID
- should filter by time range
- should compute aggregations (countByType, countByAgent, timeline)
```

**Coverage Target:** 90%

**Run:**
```bash
npm test -- tests/integration/observability-tools.test.ts
```

### 3. hive-mind-events.test.ts

Tests for **CLI Integration** with `--enable-events` flag.

**Coverage:**
- CLI flag parsing
- Event directory creation
- Event file naming conventions
- Event capture during swarm execution
- Configuration options
- Error handling
- Performance impact

**Key Test Cases:**
```typescript
- should initialize event streaming with --enable-events flag
- should create event directory if not exists
- should write swarm.start event
- should write agent.spawn events
- should write task events
- should handle --events-buffer-size option
- should continue execution if event write fails
```

**Coverage Target:** 85%

**Run:**
```bash
npm test -- tests/integration/hive-mind-events.test.ts
```

## Test Data

### Fixtures

Test fixtures are located in `tests/fixtures/events/`:

1. **sample-events.jsonl** - Basic event stream with 2 agents
2. **multi-agent-events.jsonl** - Complex scenario with 5 agents
3. **error-scenario-events.jsonl** - Events with errors and retries

### Using Fixtures in Tests

```typescript
import * as fs from 'fs-extra';
import * as path from 'path';

const fixtureFile = path.join(__dirname, '../fixtures/events/sample-events.jsonl');
const events = await readJSONLFile(fixtureFile);
```

## Running Tests

### All Integration Tests
```bash
npm test -- tests/integration/
```

### Individual Test Suites
```bash
npm test -- tests/integration/event-stream.test.ts
npm test -- tests/integration/observability-tools.test.ts
npm test -- tests/integration/hive-mind-events.test.ts
```

### With Coverage
```bash
npm run test:coverage:integration
```

### Watch Mode
```bash
npm run test:watch
```

## Test Structure

All tests follow this structure:

```typescript
describe('Feature/Component', () => {
  let testContext: TestContext;

  beforeEach(async () => {
    // Setup test environment
    testContext = await setupTestEnvironment();
  });

  afterEach(async () => {
    // Cleanup
    await cleanupTestEnvironment(testContext);
  });

  describe('Specific Functionality', () => {
    it('should behave as expected', async () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = await functionUnderTest(input);

      // Assert
      expect(result).toMatchExpectedBehavior();
    });
  });
});
```

## Test Coverage Goals

| Component              | Target | Current* |
|------------------------|--------|----------|
| EventStreamManager     | 95%    | TBD      |
| Observability Tools    | 90%    | TBD      |
| CLI Integration        | 85%    | TBD      |
| Overall                | 85%+   | TBD      |

\* Coverage will be measured once implementation is complete

## Debugging Tests

### Enable Verbose Output
```bash
npm test -- tests/integration/event-stream.test.ts --verbose
```

### Run Single Test
```bash
npm test -- tests/integration/event-stream.test.ts -t "should create event file on start"
```

### Debug with Node Inspector
```bash
npm run test:debug
# Then attach debugger to Node process
```

### View Test Logs
Tests write to temp directories. To inspect:
```bash
# Check temp directory location (printed in test output)
ls /tmp/test-events-*
cat /tmp/test-events-*/swarm-*.jsonl
```

## Common Issues

### Issue: Tests fail with "Cannot find module"

**Solution:** Ensure dependencies are installed:
```bash
npm install
```

### Issue: Tests timeout

**Solution:** Increase Jest timeout:
```typescript
jest.setTimeout(60000); // 60 seconds
```

Or in specific test:
```typescript
it('long running test', async () => {
  // test code
}, 60000); // 60 second timeout
```

### Issue: Temp directory not cleaned up

**Solution:** Manually clean temp directories:
```bash
rm -rf /tmp/test-events-*
rm -rf /tmp/test-observability-*
rm -rf /tmp/e2e-*
```

## Implementation Notes

These tests are written in **TDD style**, meaning:

1. Tests define the expected behavior and interface
2. Tests will initially fail (no implementation exists)
3. Implementation should be written to make tests pass
4. Tests serve as specification and documentation

### Expected Implementation Files

Based on these tests, the following files should be implemented:

- `src/coordination/event-stream-manager.ts` - Event streaming core
- `src/mcp/observability-tools.ts` - MCP tool implementations
- CLI updates for `--enable-events` flag
- Integration with swarm lifecycle

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive test names (should...)
3. Include both success and error cases
4. Test edge cases and boundary conditions
5. Add test data fixtures if needed
6. Update this README with new test information

## Related Documentation

- [E2E Tests](../e2e/README.md) - End-to-end test documentation
- [Examples](../../examples/meta-orchestration/) - Working examples
- [Validation Script](../../scripts/validate-meta-orchestration.sh) - Automated validation

## Questions?

For questions about tests or implementation:
1. Check existing test cases for examples
2. Review test fixtures for data structures
3. See examples/ for usage patterns
4. Consult main project documentation
