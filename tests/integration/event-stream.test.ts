/**
 * Integration tests for EventStreamManager
 * Tests the event streaming system for meta-orchestration observability
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Type definitions for EventStreamManager (TDD approach - defining expected interface)
interface EventStreamConfig {
  eventsDir?: string;
  bufferSize?: number;
  flushIntervalMs?: number;
  sessionId: string;
}

interface SwarmEvent {
  type: string;
  timestamp: string;
  sessionId: string;
  agentId?: string;
  data: any;
}

// Mock implementation for testing (will be replaced by actual implementation)
class EventStreamManager {
  private config: EventStreamConfig;
  private eventBuffer: SwarmEvent[] = [];
  private eventFilePath: string = '';
  private flushTimer: NodeJS.Timeout | null = null;
  private isStarted: boolean = false;

  constructor(config: EventStreamConfig) {
    this.config = {
      eventsDir: config.eventsDir || path.join(os.tmpdir(), 'claude-flow-events'),
      bufferSize: config.bufferSize || 10,
      flushIntervalMs: config.flushIntervalMs || 5000,
      sessionId: config.sessionId,
    };
  }

  async start(): Promise<void> {
    if (this.isStarted) return;

    // Create events directory
    await fs.ensureDir(this.config.eventsDir!);

    // Create event file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.eventFilePath = path.join(
      this.config.eventsDir!,
      `swarm-${this.config.sessionId}-${timestamp}.jsonl`
    );

    await fs.writeFile(this.eventFilePath, '');

    // Start flush timer
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushIntervalMs);

    this.isStarted = true;
  }

  captureEvent(event: Omit<SwarmEvent, 'timestamp' | 'sessionId'>): void {
    const fullEvent: SwarmEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.config.sessionId,
    };

    this.eventBuffer.push(fullEvent);

    // Auto-flush if buffer is full
    if (this.eventBuffer.length >= this.config.bufferSize!) {
      this.flush().catch(console.error);
    }
  }

  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n';
    await fs.appendFile(this.eventFilePath, lines);
  }

  async stop(): Promise<void> {
    if (!this.isStarted) return;

    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    await this.flush();

    this.isStarted = false;
  }

  getEventFilePath(): string {
    return this.eventFilePath;
  }

  getBufferSize(): number {
    return this.eventBuffer.length;
  }
}

describe('EventStreamManager', () => {
  let tempDir: string;
  let manager: EventStreamManager;

  beforeEach(async () => {
    // Create temp directory for test events
    tempDir = path.join(os.tmpdir(), `test-events-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    // Clean up
    if (manager) {
      await manager.stop();
    }
    await fs.remove(tempDir);
  });

  describe('Initialization', () => {
    it('should create event file on start', async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'test-session-1',
      });

      await manager.start();

      const eventFile = manager.getEventFilePath();
      expect(eventFile).toBeTruthy();
      expect(await fs.pathExists(eventFile)).toBe(true);

      const stats = await fs.stat(eventFile);
      expect(stats.isFile()).toBe(true);
    });

    it('should create events directory if not exists', async () => {
      const newDir = path.join(tempDir, 'nested', 'events');

      manager = new EventStreamManager({
        eventsDir: newDir,
        sessionId: 'test-session-2',
      });

      await manager.start();

      expect(await fs.pathExists(newDir)).toBe(true);
    });

    it('should generate unique event file names', async () => {
      const manager1 = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'session-1',
      });
      await manager1.start();

      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

      const manager2 = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'session-2',
      });
      await manager2.start();

      expect(manager1.getEventFilePath()).not.toBe(manager2.getEventFilePath());

      await manager1.stop();
      await manager2.stop();
    });
  });

  describe('Event Capture', () => {
    beforeEach(async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        bufferSize: 5,
        sessionId: 'test-session',
      });
      await manager.start();
    });

    it('should capture and write events', async () => {
      manager.captureEvent({
        type: 'agent.spawn',
        data: { agentId: 'agent-1', role: 'coder' },
      });

      manager.captureEvent({
        type: 'task.start',
        agentId: 'agent-1',
        data: { taskId: 'task-1', description: 'Write tests' },
      });

      await manager.flush();

      const content = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(2);

      const event1 = JSON.parse(lines[0]);
      expect(event1.type).toBe('agent.spawn');
      expect(event1.data.agentId).toBe('agent-1');
      expect(event1.timestamp).toBeTruthy();
      expect(event1.sessionId).toBe('test-session');

      const event2 = JSON.parse(lines[1]);
      expect(event2.type).toBe('task.start');
      expect(event2.agentId).toBe('agent-1');
    });

    it('should buffer events and flush periodically', async () => {
      manager.captureEvent({
        type: 'test.event',
        data: { index: 1 },
      });

      // Event should be in buffer, not yet written
      const contentBefore = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      expect(contentBefore).toBe('');
      expect(manager.getBufferSize()).toBe(1);

      // Wait for auto-flush (5 seconds by default in test config)
      await new Promise(resolve => setTimeout(resolve, 5500));

      // Event should now be written
      const contentAfter = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      expect(contentAfter.trim()).toBeTruthy();
      expect(manager.getBufferSize()).toBe(0);
    });

    it('should auto-flush when buffer is full', async () => {
      // Buffer size is 5 in test config
      for (let i = 1; i <= 5; i++) {
        manager.captureEvent({
          type: 'test.event',
          data: { index: i },
        });
      }

      // Give time for async flush
      await new Promise(resolve => setTimeout(resolve, 100));

      const content = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(5);
      expect(manager.getBufferSize()).toBe(0);
    });

    it('should handle multiple event types', async () => {
      const eventTypes = [
        'swarm.start',
        'agent.spawn',
        'task.assign',
        'task.complete',
        'agent.terminate',
        'swarm.complete',
      ];

      eventTypes.forEach((type, i) => {
        manager.captureEvent({
          type,
          data: { index: i },
        });
      });

      await manager.flush();

      const content = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(eventTypes.length);

      lines.forEach((line, i) => {
        const event = JSON.parse(line);
        expect(event.type).toBe(eventTypes[i]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file write errors gracefully', async () => {
      manager = new EventStreamManager({
        eventsDir: '/invalid/path/that/does/not/exist',
        sessionId: 'test-session',
      });

      // Should throw on start if directory cannot be created
      await expect(manager.start()).rejects.toThrow();
    });

    it('should not crash on flush error', async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'test-session',
      });
      await manager.start();

      // Capture event
      manager.captureEvent({
        type: 'test.event',
        data: {},
      });

      // Delete the event file to cause flush error
      await fs.remove(manager.getEventFilePath());

      // Flush should handle error gracefully
      await expect(manager.flush()).rejects.toThrow();

      // Manager should still be usable
      expect(manager.getBufferSize()).toBe(0);
    });

    it('should handle stop without start', async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'test-session',
      });

      // Should not throw
      await expect(manager.stop()).resolves.not.toThrow();
    });

    it('should handle multiple starts', async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'test-session',
      });

      await manager.start();
      const firstPath = manager.getEventFilePath();

      await manager.start();
      const secondPath = manager.getEventFilePath();

      // Should use same file path
      expect(firstPath).toBe(secondPath);
    });
  });

  describe('Cleanup', () => {
    it('should flush on stop', async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'test-session',
      });
      await manager.start();

      // Add events to buffer
      manager.captureEvent({ type: 'test.event.1', data: {} });
      manager.captureEvent({ type: 'test.event.2', data: {} });
      manager.captureEvent({ type: 'test.event.3', data: {} });

      expect(manager.getBufferSize()).toBe(3);

      // Stop should flush
      await manager.stop();

      const content = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(3);
      expect(manager.getBufferSize()).toBe(0);
    });

    it('should stop flush timer on stop', async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'test-session',
        flushIntervalMs: 1000,
      });
      await manager.start();

      await manager.stop();

      // Add event after stop
      manager.captureEvent({ type: 'test.event', data: {} });

      // Wait longer than flush interval
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Event should not be auto-flushed
      const content = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      expect(content.trim()).toBe('');
      expect(manager.getBufferSize()).toBe(1);
    });
  });

  describe('JSONL Format', () => {
    it('should write events in valid JSONL format', async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'test-session',
      });
      await manager.start();

      const events = [
        { type: 'event.1', data: { foo: 'bar' } },
        { type: 'event.2', data: { baz: 123 } },
        { type: 'event.3', data: { nested: { obj: true } } },
      ];

      events.forEach(e => manager.captureEvent(e));
      await manager.flush();

      const content = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      const lines = content.trim().split('\n');

      // Each line should be valid JSON
      lines.forEach(line => {
        expect(() => JSON.parse(line)).not.toThrow();
      });

      // File should end with newline
      expect(content.endsWith('\n')).toBe(true);
    });

    it('should handle events with special characters', async () => {
      manager = new EventStreamManager({
        eventsDir: tempDir,
        sessionId: 'test-session',
      });
      await manager.start();

      manager.captureEvent({
        type: 'message',
        data: {
          text: 'Line 1\nLine 2\nLine 3',
          emoji: '🚀🔥💯',
          quotes: 'He said "hello"',
        },
      });

      await manager.flush();

      const content = await fs.readFile(manager.getEventFilePath(), 'utf-8');
      const event = JSON.parse(content.trim());

      expect(event.data.text).toBe('Line 1\nLine 2\nLine 3');
      expect(event.data.emoji).toBe('🚀🔥💯');
      expect(event.data.quotes).toBe('He said "hello"');
    });
  });
});
