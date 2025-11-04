/**
 * Integration tests for MCP Observability Tools
 * Tests: swarm/monitor, swarm/message, swarm/query_events
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Type definitions for MCP tools (TDD approach)
interface MonitorToolInput {
  sessionId: string;
  lines?: number;
  format?: 'json' | 'text' | 'summary';
  eventTypes?: string[];
}

interface MessageToolInput {
  sessionId: string;
  targetAgent?: string;
  message: string;
  broadcast?: boolean;
}

interface QueryEventsToolInput {
  sessionId: string;
  filters?: {
    eventTypes?: string[];
    agentId?: string;
    timeRange?: {
      start?: string;
      end?: string;
    };
  };
  aggregations?: {
    countByType?: boolean;
    countByAgent?: boolean;
    timeline?: boolean;
  };
  limit?: number;
}

// Mock implementation of MCP tools
class ObservabilityTools {
  private eventsDir: string;

  constructor(eventsDir: string) {
    this.eventsDir = eventsDir;
  }

  async monitor(input: MonitorToolInput): Promise<any> {
    const eventFile = await this.findEventFile(input.sessionId);
    if (!eventFile) {
      return { success: false, error: 'Event file not found for session' };
    }

    const content = await fs.readFile(eventFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);

    // Parse events
    let events = lines.map(line => JSON.parse(line));

    // Filter by event types if specified
    if (input.eventTypes && input.eventTypes.length > 0) {
      events = events.filter(e => input.eventTypes!.includes(e.type));
    }

    // Get last N events
    const recentEvents = events.slice(-(input.lines || 50));

    // Format output
    if (input.format === 'json') {
      return { success: true, events: recentEvents };
    } else if (input.format === 'summary') {
      return {
        success: true,
        summary: {
          totalEvents: events.length,
          recentEvents: recentEvents.length,
          eventTypes: [...new Set(events.map(e => e.type))],
          agents: [...new Set(events.map(e => e.agentId).filter(Boolean))],
          timeRange: {
            start: events[0]?.timestamp,
            end: events[events.length - 1]?.timestamp,
          },
        },
      };
    } else {
      // text format
      const text = recentEvents
        .map(e => `[${e.timestamp}] ${e.type} ${e.agentId || ''}: ${JSON.stringify(e.data)}`)
        .join('\n');
      return { success: true, text };
    }
  }

  async message(input: MessageToolInput): Promise<any> {
    // In real implementation, this would use memory system
    // For testing, we'll simulate by writing to a messages file
    const messagesFile = path.join(this.eventsDir, `messages-${input.sessionId}.jsonl`);

    const message = {
      timestamp: new Date().toISOString(),
      sessionId: input.sessionId,
      targetAgent: input.targetAgent || (input.broadcast ? 'all' : null),
      message: input.message,
      broadcast: input.broadcast || false,
    };

    await fs.appendFile(messagesFile, JSON.stringify(message) + '\n');

    return {
      success: true,
      delivered: input.broadcast ? 'all-agents' : input.targetAgent,
      message: input.message,
    };
  }

  async queryEvents(input: QueryEventsToolInput): Promise<any> {
    const eventFile = await this.findEventFile(input.sessionId);
    if (!eventFile) {
      return { success: false, error: 'Event file not found for session' };
    }

    const content = await fs.readFile(eventFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    let events = lines.map(line => JSON.parse(line));

    // Apply filters
    if (input.filters) {
      if (input.filters.eventTypes && input.filters.eventTypes.length > 0) {
        events = events.filter(e => input.filters!.eventTypes!.includes(e.type));
      }

      if (input.filters.agentId) {
        events = events.filter(e => e.agentId === input.filters!.agentId);
      }

      if (input.filters.timeRange) {
        if (input.filters.timeRange.start) {
          events = events.filter(e => e.timestamp >= input.filters!.timeRange!.start);
        }
        if (input.filters.timeRange.end) {
          events = events.filter(e => e.timestamp <= input.filters!.timeRange!.end);
        }
      }
    }

    // Apply limit
    if (input.limit) {
      events = events.slice(0, input.limit);
    }

    // Compute aggregations
    const aggregations: any = {};

    if (input.aggregations?.countByType) {
      const counts: Record<string, number> = {};
      events.forEach(e => {
        counts[e.type] = (counts[e.type] || 0) + 1;
      });
      aggregations.countByType = counts;
    }

    if (input.aggregations?.countByAgent) {
      const counts: Record<string, number> = {};
      events.forEach(e => {
        if (e.agentId) {
          counts[e.agentId] = (counts[e.agentId] || 0) + 1;
        }
      });
      aggregations.countByAgent = counts;
    }

    if (input.aggregations?.timeline) {
      // Group by hour
      const timeline: Record<string, number> = {};
      events.forEach(e => {
        const hour = e.timestamp.substring(0, 13); // YYYY-MM-DDTHH
        timeline[hour] = (timeline[hour] || 0) + 1;
      });
      aggregations.timeline = timeline;
    }

    return {
      success: true,
      events,
      count: events.length,
      aggregations: Object.keys(aggregations).length > 0 ? aggregations : undefined,
    };
  }

  private async findEventFile(sessionId: string): Promise<string | null> {
    const files = await fs.readdir(this.eventsDir);
    const matching = files.filter(f => f.startsWith(`swarm-${sessionId}-`) && f.endsWith('.jsonl'));
    return matching.length > 0 ? path.join(this.eventsDir, matching[0]) : null;
  }
}

describe('Observability MCP Tools', () => {
  let tempDir: string;
  let tools: ObservabilityTools;
  let testSessionId: string;
  let testEventFile: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `test-observability-${Date.now()}`);
    await fs.ensureDir(tempDir);

    testSessionId = 'test-session-123';
    testEventFile = path.join(tempDir, `swarm-${testSessionId}-${Date.now()}.jsonl`);

    tools = new ObservabilityTools(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('swarm/monitor tool', () => {
    beforeEach(async () => {
      // Create test event file with sample events
      const events = [
        {
          type: 'swarm.start',
          timestamp: '2025-01-01T10:00:00Z',
          sessionId: testSessionId,
          data: { instruction: 'Build API' },
        },
        {
          type: 'agent.spawn',
          timestamp: '2025-01-01T10:00:05Z',
          sessionId: testSessionId,
          agentId: 'agent-1',
          data: { role: 'coder' },
        },
        {
          type: 'task.start',
          timestamp: '2025-01-01T10:00:10Z',
          sessionId: testSessionId,
          agentId: 'agent-1',
          data: { taskId: 'task-1', description: 'Implement endpoint' },
        },
        {
          type: 'task.complete',
          timestamp: '2025-01-01T10:05:00Z',
          sessionId: testSessionId,
          agentId: 'agent-1',
          data: { taskId: 'task-1', result: 'success' },
        },
        {
          type: 'swarm.complete',
          timestamp: '2025-01-01T10:10:00Z',
          sessionId: testSessionId,
          data: { status: 'success' },
        },
      ];

      const content = events.map(e => JSON.stringify(e)).join('\n') + '\n';
      await fs.writeFile(testEventFile, content);
    });

    it('should tail recent events', async () => {
      const result = await tools.monitor({
        sessionId: testSessionId,
        lines: 3,
        format: 'json',
      });

      expect(result.success).toBe(true);
      expect(result.events).toBeDefined();
      expect(result.events.length).toBe(3);
      expect(result.events[0].type).toBe('task.start');
      expect(result.events[2].type).toBe('swarm.complete');
    });

    it('should filter events by type', async () => {
      const result = await tools.monitor({
        sessionId: testSessionId,
        eventTypes: ['agent.spawn', 'swarm.start'],
        format: 'json',
      });

      expect(result.success).toBe(true);
      expect(result.events.length).toBe(2);
      expect(result.events.every((e: any) => ['agent.spawn', 'swarm.start'].includes(e.type))).toBe(
        true
      );
    });

    it('should format output as JSON', async () => {
      const result = await tools.monitor({
        sessionId: testSessionId,
        format: 'json',
      });

      expect(result.success).toBe(true);
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.events[0]).toHaveProperty('type');
      expect(result.events[0]).toHaveProperty('timestamp');
    });

    it('should format output as text', async () => {
      const result = await tools.monitor({
        sessionId: testSessionId,
        format: 'text',
      });

      expect(result.success).toBe(true);
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text).toContain('swarm.start');
      expect(result.text).toContain('agent.spawn');
    });

    it('should format output as summary', async () => {
      const result = await tools.monitor({
        sessionId: testSessionId,
        format: 'summary',
      });

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalEvents).toBe(5);
      expect(result.summary.eventTypes).toContain('swarm.start');
      expect(result.summary.agents).toContain('agent-1');
      expect(result.summary.timeRange.start).toBe('2025-01-01T10:00:00Z');
    });

    it('should handle missing event file', async () => {
      const result = await tools.monitor({
        sessionId: 'non-existent-session',
        format: 'json',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should default to 50 lines if not specified', async () => {
      // Create file with 100 events
      const events = Array.from({ length: 100 }, (_, i) => ({
        type: 'test.event',
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        sessionId: testSessionId,
        data: { index: i },
      }));

      await fs.writeFile(testEventFile, events.map(e => JSON.stringify(e)).join('\n') + '\n');

      const result = await tools.monitor({
        sessionId: testSessionId,
        format: 'json',
      });

      expect(result.success).toBe(true);
      expect(result.events.length).toBe(50);
      expect(result.events[0].data.index).toBe(50); // Last 50 events
    });
  });

  describe('swarm/message tool', () => {
    it('should send message to specific agent', async () => {
      const result = await tools.message({
        sessionId: testSessionId,
        targetAgent: 'agent-1',
        message: 'Please speed up task execution',
      });

      expect(result.success).toBe(true);
      expect(result.delivered).toBe('agent-1');
      expect(result.message).toBe('Please speed up task execution');

      // Verify message was written
      const messagesFile = path.join(tempDir, `messages-${testSessionId}.jsonl`);
      const content = await fs.readFile(messagesFile, 'utf-8');
      const message = JSON.parse(content.trim());

      expect(message.targetAgent).toBe('agent-1');
      expect(message.message).toBe('Please speed up task execution');
      expect(message.sessionId).toBe(testSessionId);
    });

    it('should broadcast message to all agents', async () => {
      const result = await tools.message({
        sessionId: testSessionId,
        message: 'Swarm shutting down in 5 minutes',
        broadcast: true,
      });

      expect(result.success).toBe(true);
      expect(result.delivered).toBe('all-agents');

      const messagesFile = path.join(tempDir, `messages-${testSessionId}.jsonl`);
      const content = await fs.readFile(messagesFile, 'utf-8');
      const message = JSON.parse(content.trim());

      expect(message.broadcast).toBe(true);
      expect(message.targetAgent).toBe('all');
    });

    it('should append multiple messages', async () => {
      await tools.message({
        sessionId: testSessionId,
        targetAgent: 'agent-1',
        message: 'Message 1',
      });

      await tools.message({
        sessionId: testSessionId,
        targetAgent: 'agent-2',
        message: 'Message 2',
      });

      await tools.message({
        sessionId: testSessionId,
        message: 'Broadcast message',
        broadcast: true,
      });

      const messagesFile = path.join(tempDir, `messages-${testSessionId}.jsonl`);
      const content = await fs.readFile(messagesFile, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(3);

      const messages = lines.map(l => JSON.parse(l));
      expect(messages[0].message).toBe('Message 1');
      expect(messages[1].message).toBe('Message 2');
      expect(messages[2].broadcast).toBe(true);
    });

    it('should include timestamp in messages', async () => {
      const before = new Date().toISOString();

      await tools.message({
        sessionId: testSessionId,
        targetAgent: 'agent-1',
        message: 'Test message',
      });

      const after = new Date().toISOString();

      const messagesFile = path.join(tempDir, `messages-${testSessionId}.jsonl`);
      const content = await fs.readFile(messagesFile, 'utf-8');
      const message = JSON.parse(content.trim());

      expect(message.timestamp).toBeTruthy();
      expect(message.timestamp >= before).toBe(true);
      expect(message.timestamp <= after).toBe(true);
    });
  });

  describe('swarm/query_events tool', () => {
    beforeEach(async () => {
      // Create comprehensive test dataset
      const events = [
        {
          type: 'swarm.start',
          timestamp: '2025-01-01T10:00:00Z',
          sessionId: testSessionId,
          data: {},
        },
        {
          type: 'agent.spawn',
          timestamp: '2025-01-01T10:00:05Z',
          sessionId: testSessionId,
          agentId: 'agent-1',
          data: { role: 'coder' },
        },
        {
          type: 'agent.spawn',
          timestamp: '2025-01-01T10:00:10Z',
          sessionId: testSessionId,
          agentId: 'agent-2',
          data: { role: 'tester' },
        },
        {
          type: 'task.start',
          timestamp: '2025-01-01T10:05:00Z',
          sessionId: testSessionId,
          agentId: 'agent-1',
          data: { taskId: 'task-1' },
        },
        {
          type: 'task.start',
          timestamp: '2025-01-01T10:05:30Z',
          sessionId: testSessionId,
          agentId: 'agent-2',
          data: { taskId: 'task-2' },
        },
        {
          type: 'task.complete',
          timestamp: '2025-01-01T10:10:00Z',
          sessionId: testSessionId,
          agentId: 'agent-1',
          data: { taskId: 'task-1' },
        },
        {
          type: 'task.complete',
          timestamp: '2025-01-01T10:15:00Z',
          sessionId: testSessionId,
          agentId: 'agent-2',
          data: { taskId: 'task-2' },
        },
        {
          type: 'swarm.complete',
          timestamp: '2025-01-01T10:20:00Z',
          sessionId: testSessionId,
          data: {},
        },
      ];

      await fs.writeFile(testEventFile, events.map(e => JSON.stringify(e)).join('\n') + '\n');
    });

    it('should query all events without filters', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(8);
      expect(result.events.length).toBe(8);
    });

    it('should filter by event types', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
        filters: {
          eventTypes: ['agent.spawn'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.events.every((e: any) => e.type === 'agent.spawn')).toBe(true);
    });

    it('should filter by agent ID', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
        filters: {
          agentId: 'agent-1',
        },
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(3); // spawn, task.start, task.complete
      expect(result.events.every((e: any) => e.agentId === 'agent-1')).toBe(true);
    });

    it('should filter by time range', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
        filters: {
          timeRange: {
            start: '2025-01-01T10:05:00Z',
            end: '2025-01-01T10:15:00Z',
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(4); // Both task.start and task.complete events
    });

    it('should apply limit', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
        limit: 3,
      });

      expect(result.success).toBe(true);
      expect(result.events.length).toBe(3);
    });

    it('should compute count by type aggregation', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
        aggregations: {
          countByType: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.aggregations).toBeDefined();
      expect(result.aggregations.countByType).toBeDefined();
      expect(result.aggregations.countByType['agent.spawn']).toBe(2);
      expect(result.aggregations.countByType['task.start']).toBe(2);
      expect(result.aggregations.countByType['task.complete']).toBe(2);
    });

    it('should compute count by agent aggregation', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
        aggregations: {
          countByAgent: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.aggregations.countByAgent).toBeDefined();
      expect(result.aggregations.countByAgent['agent-1']).toBe(3);
      expect(result.aggregations.countByAgent['agent-2']).toBe(3);
    });

    it('should compute timeline aggregation', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
        aggregations: {
          timeline: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.aggregations.timeline).toBeDefined();
      expect(result.aggregations.timeline['2025-01-01T10']).toBe(8); // All events in hour 10
    });

    it('should combine filters and aggregations', async () => {
      const result = await tools.queryEvents({
        sessionId: testSessionId,
        filters: {
          eventTypes: ['task.start', 'task.complete'],
        },
        aggregations: {
          countByType: true,
          countByAgent: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(4);
      expect(result.aggregations.countByType['task.start']).toBe(2);
      expect(result.aggregations.countByType['task.complete']).toBe(2);
      expect(result.aggregations.countByAgent['agent-1']).toBe(2);
      expect(result.aggregations.countByAgent['agent-2']).toBe(2);
    });

    it('should handle session with no events', async () => {
      const result = await tools.queryEvents({
        sessionId: 'empty-session',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
