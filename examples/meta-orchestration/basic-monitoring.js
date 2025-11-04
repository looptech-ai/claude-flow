#!/usr/bin/env node

/**
 * Example: Basic Swarm Monitoring with Supervisor
 *
 * This example demonstrates:
 * 1. Spawning a worker swarm with event streaming enabled
 * 2. Using a supervisor to monitor the worker swarm's progress
 * 3. Reading and displaying progress reports in real-time
 * 4. Graceful shutdown and cleanup
 *
 * Architecture:
 *
 *   Supervisor Claude           Worker Swarm
 *   ┌─────────────────┐        ┌──────────────┐
 *   │ Monitor events  │◄───────│ Agent 1      │
 *   │ Send messages   │        │ Agent 2      │
 *   │ Generate report │◄───────│ Agent 3      │
 *   └─────────────────┘        └──────────────┘
 *                                    │
 *                                    ▼
 *                              Event Stream
 *                           (events/*.jsonl)
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
  eventsDir: path.join(process.cwd(), '.claude-flow', 'events'),
  workerInstruction: 'Build a simple REST API with authentication using Express.js',
  monitorIntervalMs: 5000, // Check events every 5 seconds
  maxAgents: 3,
  timeout: 30, // 30 minutes
};

class SwarmSupervisor {
  constructor() {
    this.workerSessionId = null;
    this.workerProcess = null;
    this.monitorInterval = null;
    this.isRunning = false;
    this.lastEventCount = 0;
  }

  async start() {
    console.log('🎯 Swarm Supervisor Starting...\n');

    // Ensure events directory exists
    await fs.ensureDir(CONFIG.eventsDir);

    // Step 1: Spawn worker swarm with event streaming
    console.log('📦 Step 1: Spawning worker swarm...');
    await this.spawnWorkerSwarm();

    // Step 2: Start monitoring
    console.log('👀 Step 2: Starting event monitoring...');
    await this.startMonitoring();

    // Step 3: Setup graceful shutdown
    this.setupSignalHandlers();

    console.log('\n✅ Supervisor active. Press Ctrl+C to stop.\n');
  }

  async spawnWorkerSwarm() {
    return new Promise((resolve, reject) => {
      // Generate session ID
      this.workerSessionId = `worker-${Date.now()}`;

      console.log(`   Session ID: ${this.workerSessionId}`);
      console.log(`   Instruction: ${CONFIG.workerInstruction}`);
      console.log(`   Max Agents: ${CONFIG.maxAgents}`);

      // Build command
      const command = 'npx';
      const args = [
        'claude-flow@alpha',
        'hive-mind',
        'spawn',
        CONFIG.workerInstruction,
        '--enable-events',
        `--events-dir=${CONFIG.eventsDir}`,
        `--session-id=${this.workerSessionId}`,
        `--max-agents=${CONFIG.maxAgents}`,
        `--timeout=${CONFIG.timeout}`,
        '--claude',
      ];

      console.log(`   Command: ${command} ${args.join(' ')}\n`);

      // Spawn worker process
      this.workerProcess = spawn(command, args, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      this.isRunning = true;

      // Handle worker output
      this.workerProcess.stdout.on('data', data => {
        console.log(`[Worker] ${data.toString().trim()}`);
      });

      this.workerProcess.stderr.on('data', data => {
        console.error(`[Worker Error] ${data.toString().trim()}`);
      });

      // Handle worker exit
      this.workerProcess.on('exit', code => {
        console.log(`\n[Worker] Process exited with code ${code}`);
        this.isRunning = false;
        this.stopMonitoring();
      });

      // Wait a bit for process to start
      setTimeout(resolve, 2000);
    });
  }

  async startMonitoring() {
    console.log('   Monitoring interval: Every 5 seconds\n');

    // Initial check
    await this.checkProgress();

    // Set up periodic monitoring
    this.monitorInterval = setInterval(async () => {
      await this.checkProgress();
    }, CONFIG.monitorIntervalMs);
  }

  async checkProgress() {
    try {
      // Find event file for this session
      const eventFile = await this.findEventFile();

      if (!eventFile) {
        console.log('⏳ Waiting for event file to be created...');
        return;
      }

      // Read and analyze events
      const events = await this.readEvents(eventFile);

      if (events.length === 0) {
        console.log('⏳ No events captured yet...');
        return;
      }

      // Show progress if there are new events
      if (events.length > this.lastEventCount) {
        this.displayProgress(events);
        this.lastEventCount = events.length;
      }

      // Check if swarm completed
      const completeEvent = events.find(e => e.type === 'swarm.complete');
      if (completeEvent) {
        console.log('\n✅ Worker swarm completed!');
        this.displayFinalReport(events);
        this.stop();
      }
    } catch (error) {
      console.error('❌ Error checking progress:', error.message);
    }
  }

  async findEventFile() {
    const files = await fs.readdir(CONFIG.eventsDir);
    const matching = files.filter(
      f => f.startsWith(`swarm-${this.workerSessionId}-`) && f.endsWith('.jsonl')
    );
    return matching.length > 0 ? path.join(CONFIG.eventsDir, matching[0]) : null;
  }

  async readEvents(eventFile) {
    const content = await fs.readFile(eventFile, 'utf-8');
    return content
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => JSON.parse(line));
  }

  displayProgress(events) {
    console.log('─'.repeat(60));
    console.log('📊 Progress Update');
    console.log('─'.repeat(60));

    // Count event types
    const eventCounts = {};
    events.forEach(e => {
      eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
    });

    // Display statistics
    console.log(`Total Events: ${events.length}`);
    console.log('\nEvent Breakdown:');
    Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type.padEnd(20)} ${count}`);
      });

    // Show active agents
    const agents = [...new Set(events.map(e => e.agentId).filter(Boolean))];
    console.log(`\nActive Agents: ${agents.length}`);
    agents.forEach(agent => {
      console.log(`  - ${agent}`);
    });

    // Show recent events (last 3)
    console.log('\nRecent Activity:');
    events.slice(-3).forEach(e => {
      const time = new Date(e.timestamp).toLocaleTimeString();
      console.log(`  [${time}] ${e.type} ${e.agentId || ''}`);
    });

    console.log('─'.repeat(60) + '\n');
  }

  displayFinalReport(events) {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📈 FINAL REPORT');
    console.log('═'.repeat(60));

    const startEvent = events.find(e => e.type === 'swarm.start');
    const completeEvent = events.find(e => e.type === 'swarm.complete');

    if (startEvent && completeEvent) {
      const startTime = new Date(startEvent.timestamp);
      const endTime = new Date(completeEvent.timestamp);
      const durationMs = endTime - startTime;
      const durationMin = Math.floor(durationMs / 60000);
      const durationSec = Math.floor((durationMs % 60000) / 1000);

      console.log(`Duration: ${durationMin}m ${durationSec}s`);
    }

    // Count agents and tasks
    const agentSpawns = events.filter(e => e.type === 'agent.spawn');
    const tasksCompleted = events.filter(e => e.type === 'task.complete');
    const errors = events.filter(e => e.type === 'error');

    console.log(`Agents Spawned: ${agentSpawns.length}`);
    console.log(`Tasks Completed: ${tasksCompleted.length}`);
    console.log(`Errors: ${errors.length}`);

    // Show completion status
    if (completeEvent && completeEvent.data.status === 'success') {
      console.log('\nStatus: ✅ SUCCESS');
    } else {
      console.log('\nStatus: ⚠️  INCOMPLETE');
    }

    console.log('═'.repeat(60) + '\n');
  }

  async sendMessageToWorker(message) {
    console.log(`📨 Sending message to worker swarm: "${message}"`);

    // In real implementation, this would use MCP swarm/message tool
    // For this example, we'll write to a messages file
    const messagesFile = path.join(CONFIG.eventsDir, `messages-${this.workerSessionId}.jsonl`);

    const msg = {
      timestamp: new Date().toISOString(),
      sessionId: this.workerSessionId,
      targetAgent: 'all',
      message,
      broadcast: true,
    };

    await fs.appendFile(messagesFile, JSON.stringify(msg) + '\n');
    console.log('✅ Message sent\n');
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  async stop() {
    console.log('\n🛑 Stopping supervisor...');

    this.stopMonitoring();

    if (this.workerProcess && this.isRunning) {
      console.log('   Terminating worker process...');
      this.workerProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (this.isRunning) {
        console.log('   Force killing worker process...');
        this.workerProcess.kill('SIGKILL');
      }
    }

    console.log('✅ Supervisor stopped\n');
    process.exit(0);
  }

  setupSignalHandlers() {
    process.on('SIGINT', async () => {
      console.log('\n\nReceived SIGINT...');
      await this.stop();
    });

    process.on('SIGTERM', async () => {
      console.log('\n\nReceived SIGTERM...');
      await this.stop();
    });
  }
}

// Main execution
async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        Meta-Orchestration: Basic Monitoring Example       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  const supervisor = new SwarmSupervisor();

  try {
    await supervisor.start();

    // Example: Send a message after 30 seconds
    setTimeout(async () => {
      if (supervisor.isRunning) {
        await supervisor.sendMessageToWorker('Great progress! Keep it up!');
      }
    }, 30000);
  } catch (error) {
    console.error('❌ Supervisor error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { SwarmSupervisor };
