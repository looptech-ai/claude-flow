/**
 * MCP Observability Tools - Phase 2
 * Production-ready tools for observing and interacting with swarms
 */

import type { MCPTool } from '../../utils/types.js';
import type { ILogger } from '../../core/logger.js';
import { SwarmMemoryManager } from '../../memory/swarm-memory.js';
import { EventBus } from '../../core/event-bus.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SwarmEvent {
  id: string;
  swarmId: string;
  type: string;
  source: string;
  timestamp: number;
  data: any;
  metadata?: Record<string, any>;
}

export interface MonitorFilter {
  types?: string[];
  sources?: string[];
  since?: number;
}

export interface QueryFilter extends MonitorFilter {
  timeRange?: { start: number; end: number };
  search?: string;
}

export type AggregationType = 'count_by_type' | 'count_by_source' | 'timeline' | 'error_rate';

export interface QueryResults {
  events: SwarmEvent[];
  aggregations?: Record<string, any>;
  total: number;
}

export interface MessagePriority {
  level: 'low' | 'normal' | 'high' | 'critical';
  value: number;
}

const PRIORITY_MAP: Record<string, number> = {
  low: 1,
  normal: 5,
  high: 8,
  critical: 10,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse a JSONL event file
 */
export async function parseEventFile(filePath: string): Promise<SwarmEvent[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter((line) => line.trim());

    const events: SwarmEvent[] = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        const event = JSON.parse(lines[i]);
        events.push(event);
      } catch (parseError) {
        // Log but don't fail - skip malformed lines
        console.warn(`Skipping malformed line ${i + 1}: ${parseError}`);
      }
    }

    return events;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // File doesn't exist yet
    }
    throw error;
  }
}

/**
 * Apply filters to events
 */
export function applyFilters(events: SwarmEvent[], filter: QueryFilter): SwarmEvent[] {
  let filtered = [...events];

  // Filter by types
  if (filter.types && filter.types.length > 0) {
    filtered = filtered.filter((e) => filter.types!.includes(e.type));
  }

  // Filter by sources
  if (filter.sources && filter.sources.length > 0) {
    filtered = filtered.filter((e) => filter.sources!.includes(e.source));
  }

  // Filter by time range
  if (filter.timeRange) {
    filtered = filtered.filter(
      (e) => e.timestamp >= filter.timeRange!.start && e.timestamp <= filter.timeRange!.end,
    );
  }

  // Filter by since
  if (filter.since) {
    filtered = filtered.filter((e) => e.timestamp >= filter.since!);
  }

  // Text search
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter((e) => {
      const eventStr = JSON.stringify(e).toLowerCase();
      return eventStr.includes(searchLower);
    });
  }

  return filtered;
}

/**
 * Compute aggregations on events
 */
export function computeAggregations(
  events: SwarmEvent[],
  aggregations: AggregationType[],
): Record<string, any> {
  const results: Record<string, any> = {};

  for (const agg of aggregations) {
    switch (agg) {
      case 'count_by_type': {
        const counts: Record<string, number> = {};
        events.forEach((e) => {
          counts[e.type] = (counts[e.type] || 0) + 1;
        });
        results.count_by_type = counts;
        break;
      }

      case 'count_by_source': {
        const counts: Record<string, number> = {};
        events.forEach((e) => {
          counts[e.source] = (counts[e.source] || 0) + 1;
        });
        results.count_by_source = counts;
        break;
      }

      case 'timeline': {
        // Group by hour
        const timeline: Record<string, number> = {};
        events.forEach((e) => {
          const hour = new Date(e.timestamp).toISOString().substring(0, 13);
          timeline[hour] = (timeline[hour] || 0) + 1;
        });
        results.timeline = timeline;
        break;
      }

      case 'error_rate': {
        const total = events.length;
        const errors = events.filter(
          (e) => e.type.includes('error') || e.type.includes('failed'),
        ).length;
        results.error_rate = {
          total,
          errors,
          rate: total > 0 ? (errors / total) * 100 : 0,
        };
        break;
      }
    }
  }

  return results;
}

/**
 * Generate human-readable summary from events
 */
export function generateEventSummary(events: SwarmEvent[]): string {
  if (events.length === 0) {
    return 'No events found.';
  }

  const summary: string[] = [];
  const types: Record<string, number> = {};
  const sources: Record<string, number> = {};
  let errors = 0;

  events.forEach((e) => {
    types[e.type] = (types[e.type] || 0) + 1;
    sources[e.source] = (sources[e.source] || 0) + 1;
    if (e.type.includes('error') || e.type.includes('failed')) {
      errors++;
    }
  });

  summary.push(`Total Events: ${events.length}`);
  summary.push(`Time Range: ${new Date(events[0].timestamp).toISOString()} to ${new Date(events[events.length - 1].timestamp).toISOString()}`);
  summary.push('');

  summary.push('Event Types:');
  Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      summary.push(`  ${type}: ${count}`);
    });
  summary.push('');

  summary.push('Event Sources:');
  Object.entries(sources)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      summary.push(`  ${source}: ${count}`);
    });
  summary.push('');

  if (errors > 0) {
    summary.push(`⚠️  Errors detected: ${errors} (${((errors / events.length) * 100).toFixed(1)}%)`);
  }

  return summary.join('\n');
}

/**
 * Format events for display
 */
function formatEvents(events: SwarmEvent[], format: 'json' | 'text' | 'summary'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(events, null, 2);

    case 'summary':
      return generateEventSummary(events);

    case 'text':
    default: {
      const lines = events.map((e) => {
        const time = new Date(e.timestamp).toISOString();
        return `[${time}] ${e.type} from ${e.source}: ${JSON.stringify(e.data)}`;
      });
      return lines.join('\n');
    }
  }
}

/**
 * Get event file path for a swarm
 */
function getEventFilePath(swarmId: string): string {
  // Default to .claude/events/{swarmId}.jsonl
  return path.join(process.cwd(), '.claude', 'events', `${swarmId}.jsonl`);
}

// ============================================================================
// Tool 1: swarm/monitor
// ============================================================================

export function createSwarmMonitorTool(logger: ILogger): MCPTool {
  return {
    name: 'swarm/monitor',
    description:
      'Monitor and tail swarm events in real-time. Like tail -f for swarms. Filter by type, source, or time.',
    inputSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'ID of the swarm to monitor',
        },
        tail: {
          type: 'number',
          default: 10,
          description: 'Number of most recent events to return',
        },
        follow: {
          type: 'boolean',
          default: false,
          description: 'Enable follow mode (requires manual tail -f on event file)',
        },
        filter: {
          type: 'object',
          properties: {
            types: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by event types (e.g., ["agent:spawned", "task:completed"])',
            },
            sources: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by event sources (e.g., ["agent-123", "coordinator"])',
            },
            since: {
              type: 'number',
              description: 'Unix timestamp - only show events after this time',
            },
          },
        },
        format: {
          type: 'string',
          enum: ['json', 'text', 'summary'],
          default: 'text',
          description: 'Output format',
        },
      },
      required: ['swarmId'],
    },
    handler: async (input: any) => {
      logger.info('Monitoring swarm events', { swarmId: input.swarmId });

      try {
        const eventFile = getEventFilePath(input.swarmId);
        const tail = input.tail || 10;
        const format = input.format || 'text';
        const filter = input.filter || {};

        // Read and parse events
        let events = await parseEventFile(eventFile);

        if (events.length === 0) {
          return {
            success: true,
            swarmId: input.swarmId,
            events: [],
            message: `No events found for swarm ${input.swarmId}. Event file: ${eventFile}`,
            followCommand: input.follow
              ? `tail -f ${eventFile}`
              : 'Set follow=true to enable real-time monitoring',
          };
        }

        // Apply filters
        events = applyFilters(events, filter);

        // Get last N events
        const recentEvents = events.slice(-tail);

        // Format output
        const output = formatEvents(recentEvents, format);

        return {
          success: true,
          swarmId: input.swarmId,
          events: recentEvents,
          output,
          total: events.length,
          showing: recentEvents.length,
          filter,
          followCommand: input.follow
            ? `tail -f ${eventFile}`
            : 'Set follow=true to enable real-time monitoring',
        };
      } catch (error) {
        logger.error('Error monitoring swarm', { swarmId: input.swarmId, error });
        return {
          success: false,
          error: `Failed to monitor swarm: ${(error as Error).message}`,
          suggestion: 'Check that the swarm ID is correct and events are being recorded',
        };
      }
    },
  };
}

// ============================================================================
// Tool 2: swarm/message
// ============================================================================

export function createSwarmMessageTool(logger: ILogger): MCPTool {
  return {
    name: 'swarm/message',
    description: 'Send messages to agents within a swarm for coordination and communication',
    inputSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'ID of the swarm',
        },
        targetAgent: {
          type: 'string',
          description: 'Target agent ID, "all" for broadcast, or "queen" for coordinator',
        },
        message: {
          type: 'string',
          description: 'Message content to send',
        },
        messageType: {
          type: 'string',
          enum: ['command', 'info', 'query', 'alert'],
          default: 'info',
          description: 'Type of message',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'critical'],
          default: 'normal',
          description: 'Message priority level',
        },
        expectResponse: {
          type: 'boolean',
          default: false,
          description: 'Whether a response is expected',
        },
      },
      required: ['swarmId', 'targetAgent', 'message'],
    },
    handler: async (input: any) => {
      logger.info('Sending swarm message', {
        swarmId: input.swarmId,
        targetAgent: input.targetAgent,
        messageType: input.messageType,
      });

      try {
        // Initialize SwarmMemoryManager for this swarm
        const memoryManager = new SwarmMemoryManager({
          namespace: `swarm-${input.swarmId}`,
          persistencePath: path.join(process.cwd(), '.claude', 'swarm-memory', input.swarmId),
        });

        await memoryManager.initialize();

        // Determine share level based on target
        let shareLevel: 'private' | 'team' | 'public' = 'team';
        if (input.targetAgent === 'all') {
          shareLevel = 'public';
        } else if (input.targetAgent === 'queen') {
          shareLevel = 'team';
        }

        // Store message in memory
        const messageId = await memoryManager.remember(
          input.targetAgent === 'all' ? 'broadcast' : input.targetAgent,
          'communication',
          {
            message: input.message,
            messageType: input.messageType || 'info',
            expectResponse: input.expectResponse || false,
            from: 'mcp-tool',
          },
          {
            tags: [input.messageType || 'info', `swarm-${input.swarmId}`],
            priority: PRIORITY_MAP[input.priority || 'normal'],
            shareLevel,
          },
        );

        // Emit event via EventBus
        const eventBus = EventBus.getInstance();
        eventBus.emit('message:sent', {
          messageId,
          swarmId: input.swarmId,
          targetAgent: input.targetAgent,
          messageType: input.messageType || 'info',
          priority: input.priority || 'normal',
          timestamp: Date.now(),
        });

        // Record event to file
        const eventFile = getEventFilePath(input.swarmId);
        await fs.mkdir(path.dirname(eventFile), { recursive: true });

        const event: SwarmEvent = {
          id: messageId,
          swarmId: input.swarmId,
          type: 'message:sent',
          source: 'mcp-tool',
          timestamp: Date.now(),
          data: {
            targetAgent: input.targetAgent,
            messageType: input.messageType || 'info',
            priority: input.priority || 'normal',
            messagePreview: input.message.substring(0, 100),
          },
        };

        await fs.appendFile(eventFile, JSON.stringify(event) + '\n');

        await memoryManager.shutdown();

        return {
          success: true,
          messageId,
          swarmId: input.swarmId,
          targetAgent: input.targetAgent,
          deliveryStatus: 'stored',
          shareLevel,
          timestamp: new Date().toISOString(),
          message: `Message sent to ${input.targetAgent} with ${input.priority} priority`,
        };
      } catch (error) {
        logger.error('Error sending swarm message', {
          swarmId: input.swarmId,
          error,
        });
        return {
          success: false,
          error: `Failed to send message: ${(error as Error).message}`,
          suggestion:
            'Ensure SwarmMemoryManager is initialized and the swarm ID is valid',
        };
      }
    },
  };
}

// ============================================================================
// Tool 3: swarm/query_events
// ============================================================================

export function createQueryEventsTool(logger: ILogger): MCPTool {
  return {
    name: 'swarm/query_events',
    description:
      'Query and analyze historical swarm events with advanced filtering and aggregations',
    inputSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'ID of the swarm to query',
        },
        query: {
          type: 'object',
          properties: {
            types: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by event types',
            },
            sources: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by event sources',
            },
            timeRange: {
              type: 'object',
              properties: {
                start: { type: 'number', description: 'Start timestamp (Unix ms)' },
                end: { type: 'number', description: 'End timestamp (Unix ms)' },
              },
              description: 'Time range for events',
            },
            search: {
              type: 'string',
              description: 'Text search in event data',
            },
          },
          description: 'Query filters',
        },
        aggregations: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['count_by_type', 'count_by_source', 'timeline', 'error_rate'],
          },
          description: 'Aggregations to compute',
        },
        limit: {
          type: 'number',
          default: 100,
          description: 'Maximum number of events to return',
        },
      },
      required: ['swarmId'],
    },
    handler: async (input: any) => {
      logger.info('Querying swarm events', {
        swarmId: input.swarmId,
        query: input.query,
      });

      try {
        const eventFile = getEventFilePath(input.swarmId);
        const query = input.query || {};
        const limit = input.limit || 100;

        // Read and parse events
        let events = await parseEventFile(eventFile);

        if (events.length === 0) {
          return {
            success: true,
            swarmId: input.swarmId,
            events: [],
            total: 0,
            message: `No events found for swarm ${input.swarmId}`,
          };
        }

        // Apply filters
        const filteredEvents = applyFilters(events, query);

        // Compute aggregations
        const aggregations = input.aggregations
          ? computeAggregations(filteredEvents, input.aggregations)
          : undefined;

        // Limit results
        const resultEvents = filteredEvents.slice(0, limit);

        return {
          success: true,
          swarmId: input.swarmId,
          events: resultEvents,
          total: filteredEvents.length,
          showing: resultEvents.length,
          query,
          aggregations,
          summary: generateEventSummary(resultEvents),
        };
      } catch (error) {
        logger.error('Error querying swarm events', {
          swarmId: input.swarmId,
          error,
        });
        return {
          success: false,
          error: `Failed to query events: ${(error as Error).message}`,
          suggestion: 'Check that the swarm ID exists and has recorded events',
        };
      }
    },
  };
}
