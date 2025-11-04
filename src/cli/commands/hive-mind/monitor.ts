#!/usr/bin/env node
/**
 * Hive Mind Event Monitor Command
 *
 * Monitor swarm events in real-time or view historical events
 */

import { Command } from '../commander-fix.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { spawn as spawnProcess } from 'child_process';
import { formatError, formatInfo } from '../../formatter.js';

interface SwarmEvent {
  timestamp: string;
  eventType: string;
  swarmId: string;
  payload: any;
  metadata?: any;
}

export const monitorCommand = new Command('monitor')
  .description('Monitor swarm events in real-time')
  .argument('<swarmId>', 'Swarm ID to monitor')
  .option('-n, --tail <number>', 'Number of events to show', '10')
  .option('-f, --follow', 'Follow mode (stream new events)', false)
  .option('--filter <types>', 'Filter by event types (comma-separated)')
  .option('--format <type>', 'Output format (pretty, json)', 'pretty')
  .action(async (swarmId, options) => {
    try {
      const eventFile = `.claude/events/${swarmId}.jsonl`;

      // Check if file exists
      try {
        await fs.access(eventFile);
      } catch (error) {
        console.error(
          formatError(`Event file not found: ${eventFile}`),
        );
        console.log(
          formatInfo(
            '\nEvent streaming may not be enabled for this swarm.',
          ),
        );
        console.log(
          formatInfo(
            'Enable it with: npx claude-flow hive-mind spawn <type> --enable-events',
          ),
        );
        process.exit(1);
      }

      if (options.follow) {
        // Follow mode - tail -f
        console.log(chalk.cyan(`Following events for swarm ${swarmId}...`));
        console.log(chalk.gray(`Press Ctrl+C to stop\n`));

        const tail = spawnProcess('tail', ['-f', eventFile]);

        tail.stdout?.on('data', (data: Buffer) => {
          const lines = data.toString().trim().split('\n');
          for (const line of lines) {
            if (line) {
              try {
                const event = JSON.parse(line) as SwarmEvent;
                if (shouldDisplayEvent(event, options.filter)) {
                  displayEvent(event, options.format);
                }
              } catch (error) {
                console.error(chalk.red('Error parsing event:'), line);
              }
            }
          }
        });

        tail.stderr?.on('data', (data: Buffer) => {
          console.error(chalk.red('tail error:'), data.toString());
        });

        tail.on('close', (code) => {
          if (code !== 0 && code !== null) {
            console.error(chalk.red(`tail process exited with code ${code}`));
          }
        });

        // Handle Ctrl+C
        process.on('SIGINT', () => {
          console.log(chalk.yellow('\n\nStopping monitor...'));
          tail.kill();
          process.exit(0);
        });
      } else {
        // Read last N events
        const content = await fs.readFile(eventFile, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        const tailCount = parseInt(options.tail, 10);
        const recentLines = lines.slice(-tailCount);

        console.log(
          chalk.cyan(`\nShowing last ${recentLines.length} events for swarm ${swarmId}:\n`),
        );

        for (const line of recentLines) {
          try {
            const event = JSON.parse(line) as SwarmEvent;
            if (shouldDisplayEvent(event, options.filter)) {
              displayEvent(event, options.format);
            }
          } catch (error) {
            console.error(chalk.red('Error parsing event:'), line);
          }
        }

        console.log(
          chalk.gray(`\n💡 Use --follow to stream new events in real-time`),
        );
      }
    } catch (error) {
      console.error(formatError('Failed to monitor events'));
      console.error(formatError((error as Error).message));
      process.exit(1);
    }
  });

function shouldDisplayEvent(event: SwarmEvent, filter?: string): boolean {
  if (!filter) return true;

  const filterTypes = filter.split(',').map((t) => t.trim().toLowerCase());
  return filterTypes.includes(event.eventType.toLowerCase());
}

function displayEvent(event: SwarmEvent, format: string): void {
  if (format === 'json') {
    console.log(JSON.stringify(event));
    return;
  }

  // Pretty format
  const time = new Date(event.timestamp).toLocaleTimeString();
  const typeColor = getEventTypeColor(event.eventType);

  console.log(
    `${chalk.gray(time)} ${typeColor(event.eventType.padEnd(20))} ${chalk.white(formatPayload(event.payload))}`,
  );
}

function getEventTypeColor(eventType: string): (str: string) => string {
  const colors: Record<string, (str: string) => string> = {
    swarm_initialized: chalk.green,
    agent_spawned: chalk.cyan,
    agent_terminated: chalk.red,
    task_submitted: chalk.blue,
    task_assigned: chalk.magenta,
    task_started: chalk.yellow,
    task_completed: chalk.green,
    task_failed: chalk.red,
    consensus_proposed: chalk.blue,
    consensus_achieved: chalk.green,
    memory_updated: chalk.gray,
    communication_sent: chalk.white,
    error: chalk.red,
  };

  return colors[eventType] || chalk.white;
}

function formatPayload(payload: any): string {
  if (!payload) return '';

  // Extract key information for display
  const parts: string[] = [];

  if (payload.agentName) parts.push(`agent: ${payload.agentName}`);
  if (payload.agentType) parts.push(`type: ${payload.agentType}`);
  if (payload.taskId) parts.push(`task: ${payload.taskId}`);
  if (payload.description) parts.push(`desc: ${payload.description.substring(0, 50)}...`);
  if (payload.status) parts.push(`status: ${payload.status}`);
  if (payload.priority) parts.push(`priority: ${payload.priority}`);

  return parts.join(' | ');
}
