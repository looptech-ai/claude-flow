/**
 * EventStreamManager - Robust event streaming system for Claude Flow
 *
 * Bridges internal events to external observers through buffered JSONL file streams.
 * Captures all major event types from the EventBus and persists them for observability.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventBus } from '../core/event-bus.js';
import { SystemEvents } from '../utils/types.js';
import type { ILogger } from '../core/logger.js';

/**
 * Configuration for the EventStreamManager
 */
export interface EventStreamConfig {
  /** Unique identifier for the swarm/session */
  swarmId: string;

  /** Directory path where event files will be written */
  outputPath: string;

  /** Enable buffered writes (recommended for performance) */
  enableBuffering?: boolean;

  /** Buffer flush interval in milliseconds (default: 1000ms) */
  flushInterval?: number;

  /** Maximum buffer size before force flush (default: 100 events) */
  maxBufferSize?: number;

  /** Optional event filter function */
  eventFilter?: EventFilter;

  /** Include timestamp in each event (default: true) */
  includeTimestamp?: boolean;

  /** Enable compression for event data (future enhancement) */
  enableCompression?: boolean;
}

/**
 * Function type for filtering events
 */
export type EventFilter = (event: SwarmEvent) => boolean;

/**
 * Structured event format for JSONL output
 */
export interface SwarmEvent {
  /** Event timestamp in ISO format */
  timestamp: string;

  /** Event type (matches SystemEvents enum) */
  eventType: string;

  /** Swarm/session identifier */
  swarmId: string;

  /** Event-specific payload */
  payload: unknown;

  /** Optional event metadata */
  metadata?: {
    source?: string;
    sequence?: number;
    tags?: string[];
  };
}

/**
 * Statistics about event streaming
 */
interface StreamStats {
  totalEvents: number;
  eventsBuffered: number;
  eventsFlushed: number;
  lastFlushTime?: Date;
  errors: number;
  startTime: Date;
}

/**
 * EventStreamManager Implementation
 *
 * Subscribes to all major event types from EventBus and writes them to JSONL files
 * with buffering, error handling, and graceful lifecycle management.
 */
export class EventStreamManager {
  private config: Required<EventStreamConfig>;
  private logger: ILogger;
  private eventBus: EventBus;

  private eventBuffer: SwarmEvent[] = [];
  private writeStream?: fs.WriteStream;
  private flushTimer?: ReturnType<typeof setInterval>;
  private isStarted = false;
  private sequenceNumber = 0;
  private outputFilePath: string;

  private stats: StreamStats = {
    totalEvents: 0,
    eventsBuffered: 0,
    eventsFlushed: 0,
    errors: 0,
    startTime: new Date(),
  };

  // Event handlers stored for cleanup
  private eventHandlers = new Map<string, (data: unknown) => void>();

  constructor(config: EventStreamConfig, logger: ILogger) {
    this.logger = logger;
    this.eventBus = EventBus.getInstance();

    // Apply defaults to config
    this.config = {
      swarmId: config.swarmId,
      outputPath: config.outputPath,
      enableBuffering: config.enableBuffering ?? true,
      flushInterval: config.flushInterval ?? 1000,
      maxBufferSize: config.maxBufferSize ?? 100,
      eventFilter: config.eventFilter ?? (() => true),
      includeTimestamp: config.includeTimestamp ?? true,
      enableCompression: config.enableCompression ?? false,
    };

    // Calculate output file path
    this.outputFilePath = path.join(
      this.config.outputPath,
      `${this.config.swarmId}.jsonl`
    );
  }

  /**
   * Start the event stream manager
   * Creates output directory, opens write stream, and subscribes to events
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      this.logger.warn('EventStreamManager already started');
      return;
    }

    try {
      this.logger.info('Starting EventStreamManager', {
        swarmId: this.config.swarmId,
        outputPath: this.outputFilePath,
        buffering: this.config.enableBuffering,
      });

      // Create output directory if it doesn't exist
      await this.ensureOutputDirectory();

      // Open write stream
      await this.openWriteStream();

      // Subscribe to all event types
      this.subscribeToEvents();

      // Start flush timer if buffering is enabled
      if (this.config.enableBuffering) {
        this.startFlushTimer();
      }

      this.isStarted = true;
      this.stats.startTime = new Date();

      this.logger.info('EventStreamManager started successfully');
    } catch (error) {
      this.logger.error('Failed to start EventStreamManager', error);
      throw error;
    }
  }

  /**
   * Stop the event stream manager
   * Flushes remaining events, closes stream, and unsubscribes from events
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    try {
      this.logger.info('Stopping EventStreamManager', {
        eventsBuffered: this.eventBuffer.length,
      });

      // Stop flush timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = undefined;
      }

      // Flush remaining buffered events
      if (this.eventBuffer.length > 0) {
        await this.flush();
      }

      // Unsubscribe from all events
      this.unsubscribeFromEvents();

      // Close write stream
      await this.closeWriteStream();

      this.isStarted = false;

      this.logger.info('EventStreamManager stopped successfully', {
        stats: this.getStats(),
      });
    } catch (error) {
      this.logger.error('Error stopping EventStreamManager', error);
      throw error;
    }
  }

  /**
   * Get current streaming statistics
   */
  getStats(): StreamStats {
    return { ...this.stats };
  }

  /**
   * Manually flush buffered events to disk
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const eventsToWrite = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      for (const event of eventsToWrite) {
        await this.writeEvent(event);
      }

      this.stats.eventsFlushed += eventsToWrite.length;
      this.stats.lastFlushTime = new Date();

      this.logger.debug('Flushed events to disk', {
        count: eventsToWrite.length,
      });
    } catch (error) {
      this.logger.error('Error flushing events', error);
      this.stats.errors++;
      // Put events back in buffer for retry
      this.eventBuffer.unshift(...eventsToWrite);
      throw error;
    }
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.promises.mkdir(this.config.outputPath, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create output directory', error);
      throw error;
    }
  }

  /**
   * Open write stream for JSONL output
   */
  private async openWriteStream(): Promise<void> {
    try {
      this.writeStream = fs.createWriteStream(this.outputFilePath, {
        flags: 'a', // Append mode
        encoding: 'utf8',
      });

      // Handle stream errors
      this.writeStream.on('error', (error) => {
        this.logger.error('Write stream error', error);
        this.stats.errors++;
      });

      // Wait for stream to be ready
      await new Promise<void>((resolve, reject) => {
        this.writeStream!.once('open', () => resolve());
        this.writeStream!.once('error', reject);
      });
    } catch (error) {
      this.logger.error('Failed to open write stream', error);
      throw error;
    }
  }

  /**
   * Close write stream
   */
  private async closeWriteStream(): Promise<void> {
    if (!this.writeStream) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.writeStream!.end((error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Subscribe to all major event types from EventBus
   */
  private subscribeToEvents(): void {
    // Task events
    this.subscribeToEvent(SystemEvents.TASK_CREATED);
    this.subscribeToEvent(SystemEvents.TASK_ASSIGNED);
    this.subscribeToEvent(SystemEvents.TASK_STARTED);
    this.subscribeToEvent(SystemEvents.TASK_COMPLETED);
    this.subscribeToEvent(SystemEvents.TASK_FAILED);
    this.subscribeToEvent(SystemEvents.TASK_CANCELLED);

    // Agent events
    this.subscribeToEvent(SystemEvents.AGENT_SPAWNED);
    this.subscribeToEvent(SystemEvents.AGENT_TERMINATED);
    this.subscribeToEvent(SystemEvents.AGENT_ERROR);
    this.subscribeToEvent(SystemEvents.AGENT_IDLE);
    this.subscribeToEvent(SystemEvents.AGENT_ACTIVE);

    // Memory events
    this.subscribeToEvent(SystemEvents.MEMORY_CREATED);
    this.subscribeToEvent(SystemEvents.MEMORY_UPDATED);
    this.subscribeToEvent(SystemEvents.MEMORY_DELETED);
    this.subscribeToEvent(SystemEvents.MEMORY_SYNCED);

    // System events
    this.subscribeToEvent(SystemEvents.SYSTEM_READY);
    this.subscribeToEvent(SystemEvents.SYSTEM_SHUTDOWN);
    this.subscribeToEvent(SystemEvents.SYSTEM_ERROR);
    this.subscribeToEvent(SystemEvents.SYSTEM_HEALTHCHECK);

    // Coordination events
    this.subscribeToEvent(SystemEvents.RESOURCE_ACQUIRED);
    this.subscribeToEvent(SystemEvents.RESOURCE_RELEASED);
    this.subscribeToEvent(SystemEvents.DEADLOCK_DETECTED);
    this.subscribeToEvent(SystemEvents.MESSAGE_SENT);
    this.subscribeToEvent(SystemEvents.MESSAGE_RECEIVED);

    // Metrics events
    this.subscribeToEvent('metrics:collected');

    // HiveMind-specific events (subscribe to common event names)
    this.subscribeToCustomEvent('agentSpawned');
    this.subscribeToCustomEvent('agentRegistered');
    this.subscribeToCustomEvent('taskSubmitted');
    this.subscribeToCustomEvent('taskDecision');
    this.subscribeToCustomEvent('memory:added');
    this.subscribeToCustomEvent('memory:shared');
    this.subscribeToCustomEvent('alert');
    this.subscribeToCustomEvent('initialized');
    this.subscribeToCustomEvent('shutdown');

    this.logger.info('Subscribed to all major event types', {
      eventCount: this.eventHandlers.size,
    });
  }

  /**
   * Subscribe to a single event type
   */
  private subscribeToEvent(eventType: string): void {
    const handler = (data: unknown) => {
      this.handleEvent(eventType, data);
    };

    this.eventHandlers.set(eventType, handler);
    this.eventBus.on(eventType, handler);
  }

  /**
   * Subscribe to custom event (not in SystemEvents enum)
   */
  private subscribeToCustomEvent(eventType: string): void {
    const handler = (data: unknown) => {
      this.handleEvent(eventType, data);
    };

    this.eventHandlers.set(eventType, handler);
    this.eventBus.on(eventType, handler);
  }

  /**
   * Unsubscribe from all events
   */
  private unsubscribeFromEvents(): void {
    for (const [eventType, handler] of this.eventHandlers.entries()) {
      this.eventBus.off(eventType, handler);
    }
    this.eventHandlers.clear();
  }

  /**
   * Handle incoming event
   */
  private handleEvent(eventType: string, payload: unknown): void {
    try {
      const event: SwarmEvent = {
        timestamp: new Date().toISOString(),
        eventType,
        swarmId: this.config.swarmId,
        payload,
        metadata: {
          sequence: this.sequenceNumber++,
        },
      };

      // Apply filter if configured
      if (!this.config.eventFilter(event)) {
        return;
      }

      this.stats.totalEvents++;

      if (this.config.enableBuffering) {
        // Add to buffer
        this.eventBuffer.push(event);
        this.stats.eventsBuffered++;

        // Force flush if buffer is full
        if (this.eventBuffer.length >= this.config.maxBufferSize) {
          this.flush().catch((error) => {
            this.logger.error('Error during force flush', error);
          });
        }
      } else {
        // Write immediately
        this.writeEvent(event).catch((error) => {
          this.logger.error('Error writing event', error);
          this.stats.errors++;
        });
      }
    } catch (error) {
      this.logger.error('Error handling event', { eventType, error });
      this.stats.errors++;
    }
  }

  /**
   * Write a single event to the JSONL file
   */
  private async writeEvent(event: SwarmEvent): Promise<void> {
    if (!this.writeStream) {
      throw new Error('Write stream not initialized');
    }

    try {
      const jsonLine = JSON.stringify(event) + '\n';

      return new Promise((resolve, reject) => {
        const success = this.writeStream!.write(jsonLine, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });

        // If write buffer is full, wait for drain
        if (!success) {
          this.writeStream!.once('drain', () => resolve());
        }
      });
    } catch (error) {
      this.logger.error('Error writing event to stream', error);
      throw error;
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flush().catch((error) => {
          this.logger.error('Error during scheduled flush', error);
        });
      }
    }, this.config.flushInterval);
  }

  /**
   * Check if manager is running
   */
  isRunning(): boolean {
    return this.isStarted;
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.eventBuffer.length;
  }

  /**
   * Get output file path
   */
  getOutputPath(): string {
    return this.outputFilePath;
  }
}
