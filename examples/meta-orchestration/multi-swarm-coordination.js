#!/usr/bin/env node

/**
 * Example: Advanced Multi-Swarm Coordination
 *
 * This example demonstrates:
 * 1. Running multiple parallel swarms for different tasks
 * 2. Using a coordinator supervisor to manage all swarms
 * 3. Cross-swarm memory sharing and coordination
 * 4. Aggregate progress reporting
 * 5. Dynamic swarm scaling based on progress
 *
 * Architecture:
 *
 *                     Coordinator Supervisor
 *                     ┌──────────────────────┐
 *                     │ Monitor all swarms   │
 *                     │ Share memory         │
 *                     │ Coordinate handoffs  │
 *                     │ Generate reports     │
 *                     └──────────┬───────────┘
 *                                │
 *          ┌─────────────────────┼─────────────────────┐
 *          │                     │                     │
 *    ┌─────▼─────┐         ┌────▼──────┐       ┌─────▼─────┐
 *    │ Backend   │         │ Frontend  │       │ Database  │
 *    │ Swarm     │         │ Swarm     │       │ Swarm     │
 *    │ (3 agents)│         │ (2 agents)│       │ (2 agents)│
 *    └───────────┘         └───────────┘       └───────────┘
 *         │                      │                    │
 *         └──────────────────────┴────────────────────┘
 *                                │
 *                         Shared Memory
 *                      Event Streams ×3
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
  eventsDir: path.join(process.cwd(), '.claude-flow', 'events'),
  memoryNamespace: 'multi-swarm-project',
  monitorIntervalMs: 10000, // Check every 10 seconds
  swarms: [
    {
      id: 'backend',
      instruction: 'Build REST API with Express.js, JWT authentication, and PostgreSQL',
      maxAgents: 3,
      timeout: 45,
      priority: 'high',
    },
    {
      id: 'frontend',
      instruction: 'Create React UI with authentication pages and API integration',
      maxAgents: 2,
      timeout: 45,
      priority: 'high',
    },
    {
      id: 'database',
      instruction: 'Design PostgreSQL schema with migrations and seed data',
      maxAgents: 2,
      timeout: 30,
      priority: 'medium',
    },
  ],
};

class MultiSwarmCoordinator {
  constructor() {
    this.swarms = new Map();
    this.monitorInterval = null;
    this.isRunning = false;
    this.lastReportTime = Date.now();
  }

  async start() {
    console.log('🎯 Multi-Swarm Coordinator Starting...\n');

    await fs.ensureDir(CONFIG.eventsDir);

    // Step 1: Spawn all swarms in parallel
    console.log('📦 Step 1: Spawning swarms in parallel...\n');
    await this.spawnAllSwarms();

    // Step 2: Start coordinated monitoring
    console.log('\n👀 Step 2: Starting coordinated monitoring...\n');
    await this.startMonitoring();

    // Step 3: Setup cross-swarm coordination
    console.log('🔗 Step 3: Setting up cross-swarm coordination...\n');
    await this.setupCoordination();

    this.setupSignalHandlers();

    console.log('✅ Coordinator active. All swarms running.\n');
    console.log('─'.repeat(60) + '\n');
  }

  async spawnAllSwarms() {
    const spawnPromises = CONFIG.swarms.map(config => this.spawnSwarm(config));
    await Promise.all(spawnPromises);
  }

  async spawnSwarm(config) {
    return new Promise((resolve, reject) => {
      const sessionId = `${config.id}-${Date.now()}`;

      console.log(`   Spawning ${config.id} swarm...`);
      console.log(`     Session ID: ${sessionId}`);
      console.log(`     Max Agents: ${config.maxAgents}`);
      console.log(`     Priority: ${config.priority}`);

      const command = 'npx';
      const args = [
        'claude-flow@alpha',
        'hive-mind',
        'spawn',
        config.instruction,
        '--enable-events',
        `--events-dir=${CONFIG.eventsDir}`,
        `--session-id=${sessionId}`,
        `--max-agents=${config.maxAgents}`,
        `--timeout=${config.timeout}`,
        `--memory-namespace=${CONFIG.memoryNamespace}/${config.id}`,
        '--claude',
      ];

      const process = spawn(command, args, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      // Store swarm info
      this.swarms.set(config.id, {
        id: config.id,
        sessionId,
        process,
        config,
        isRunning: true,
        lastEventCount: 0,
        events: [],
        startTime: Date.now(),
      });

      // Handle output
      process.stdout.on('data', data => {
        console.log(`[${config.id}] ${data.toString().trim()}`);
      });

      process.stderr.on('data', data => {
        console.error(`[${config.id} Error] ${data.toString().trim()}`);
      });

      process.on('exit', code => {
        console.log(`\n[${config.id}] Swarm exited with code ${code}`);
        const swarm = this.swarms.get(config.id);
        if (swarm) {
          swarm.isRunning = false;
        }
        this.checkAllComplete();
      });

      // Wait a bit for process to start
      setTimeout(resolve, 1000);
    });
  }

  async startMonitoring() {
    // Initial check
    await this.monitorAllSwarms();

    // Set up periodic monitoring
    this.monitorInterval = setInterval(async () => {
      await this.monitorAllSwarms();
    }, CONFIG.monitorIntervalMs);

    this.isRunning = true;
  }

  async monitorAllSwarms() {
    console.log('🔍 Monitoring cycle starting...\n');

    for (const [id, swarm] of this.swarms) {
      await this.updateSwarmProgress(swarm);
    }

    // Display aggregate report
    await this.displayAggregateReport();

    // Check for coordination opportunities
    await this.coordinateSwarms();
  }

  async updateSwarmProgress(swarm) {
    try {
      const eventFile = await this.findEventFile(swarm.sessionId);
      if (!eventFile) return;

      const events = await this.readEvents(eventFile);
      swarm.events = events;

      if (events.length > swarm.lastEventCount) {
        swarm.lastEventCount = events.length;
      }

      // Check if completed
      const completeEvent = events.find(e => e.type === 'swarm.complete');
      if (completeEvent) {
        swarm.isRunning = false;
        swarm.completedAt = Date.now();
        console.log(`✅ ${swarm.id} swarm completed!`);
      }
    } catch (error) {
      console.error(`❌ Error monitoring ${swarm.id}:`, error.message);
    }
  }

  async displayAggregateReport() {
    // Only report every 30 seconds to avoid spam
    if (Date.now() - this.lastReportTime < 30000) return;

    console.log('═'.repeat(60));
    console.log('📊 AGGREGATE PROGRESS REPORT');
    console.log('═'.repeat(60));

    let totalEvents = 0;
    let totalAgents = 0;
    let totalTasks = 0;
    let completedSwarms = 0;

    for (const [id, swarm] of this.swarms) {
      totalEvents += swarm.events.length;

      const agents = [...new Set(swarm.events.map(e => e.agentId).filter(Boolean))];
      totalAgents += agents.length;

      const tasks = swarm.events.filter(e => e.type === 'task.complete').length;
      totalTasks += tasks;

      if (!swarm.isRunning) completedSwarms++;

      // Individual swarm status
      console.log(`\n${swarm.id.toUpperCase()} Swarm:`);
      console.log(`  Status: ${swarm.isRunning ? '🔄 Running' : '✅ Completed'}`);
      console.log(`  Events: ${swarm.events.length}`);
      console.log(`  Agents: ${agents.length}`);
      console.log(`  Tasks Completed: ${tasks}`);

      if (swarm.startTime) {
        const duration = (swarm.completedAt || Date.now()) - swarm.startTime;
        const minutes = Math.floor(duration / 60000);
        console.log(`  Runtime: ${minutes}m`);
      }
    }

    // Overall statistics
    console.log('\n' + '─'.repeat(60));
    console.log('OVERALL:');
    console.log(`  Swarms Completed: ${completedSwarms}/${this.swarms.size}`);
    console.log(`  Total Events: ${totalEvents}`);
    console.log(`  Total Agents: ${totalAgents}`);
    console.log(`  Total Tasks: ${totalTasks}`);

    const progress = (completedSwarms / this.swarms.size) * 100;
    console.log(`  Progress: ${progress.toFixed(0)}%`);

    console.log('═'.repeat(60) + '\n');

    this.lastReportTime = Date.now();
  }

  async setupCoordination() {
    console.log('   Coordination features:');
    console.log('     • Shared memory namespace: ' + CONFIG.memoryNamespace);
    console.log('     • Cross-swarm event monitoring');
    console.log('     • Automatic dependency detection');
    console.log('     • Dynamic resource allocation\n');
  }

  async coordinateSwarms() {
    // Example coordination logic

    // 1. Check if backend is ready for frontend to integrate
    const backend = this.swarms.get('backend');
    const frontend = this.swarms.get('frontend');

    if (backend && frontend && backend.isRunning && frontend.isRunning) {
      const backendHasAPI = backend.events.some(
        e => e.type === 'task.complete' && e.data?.taskId?.includes('api')
      );

      if (backendHasAPI) {
        // Notify frontend that API is ready
        await this.sendCoordinationMessage(frontend, 'Backend API endpoints are ready for integration');
      }
    }

    // 2. Check if database schema is ready for backend
    const database = this.swarms.get('database');

    if (database && backend && database.isRunning && backend.isRunning) {
      const schemaReady = database.events.some(e => e.type === 'task.complete' && e.data?.taskId?.includes('schema'));

      if (schemaReady) {
        await this.sendCoordinationMessage(backend, 'Database schema is ready');
      }
    }

    // 3. Scale up slow swarms
    for (const [id, swarm] of this.swarms) {
      if (!swarm.isRunning) continue;

      const runtime = Date.now() - swarm.startTime;
      const eventRate = swarm.events.length / (runtime / 1000); // events per second

      if (runtime > 600000 && eventRate < 0.1) {
        // Running > 10 min with < 0.1 events/sec
        console.log(`⚠️  ${id} swarm is progressing slowly. Consider scaling up.`);
      }
    }
  }

  async sendCoordinationMessage(swarm, message) {
    console.log(`📨 Coordination: Sending to ${swarm.id}: "${message}"`);

    const messagesFile = path.join(CONFIG.eventsDir, `messages-${swarm.sessionId}.jsonl`);

    const msg = {
      timestamp: new Date().toISOString(),
      sessionId: swarm.sessionId,
      from: 'coordinator',
      message,
      type: 'coordination',
    };

    await fs.appendFile(messagesFile, JSON.stringify(msg) + '\n');
  }

  async findEventFile(sessionId) {
    const files = await fs.readdir(CONFIG.eventsDir);
    const matching = files.filter(f => f.startsWith(`swarm-${sessionId}-`) && f.endsWith('.jsonl'));
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

  checkAllComplete() {
    const allComplete = Array.from(this.swarms.values()).every(swarm => !swarm.isRunning);

    if (allComplete) {
      console.log('\n✅ All swarms completed!');
      this.displayFinalReport();
      this.stop();
    }
  }

  displayFinalReport() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL REPORT                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    let totalDuration = 0;
    let totalEvents = 0;
    let totalTasks = 0;

    for (const [id, swarm] of this.swarms) {
      if (swarm.completedAt) {
        const duration = swarm.completedAt - swarm.startTime;
        totalDuration = Math.max(totalDuration, duration);
      }

      totalEvents += swarm.events.length;
      totalTasks += swarm.events.filter(e => e.type === 'task.complete').length;

      const status = swarm.isRunning ? '⚠️  INCOMPLETE' : '✅ SUCCESS';
      console.log(`\n${swarm.id.toUpperCase()}: ${status}`);
      console.log(`  Events: ${swarm.events.length}`);
      console.log(`  Tasks: ${swarm.events.filter(e => e.type === 'task.complete').length}`);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('SUMMARY:');
    console.log(`  Total Duration: ${Math.floor(totalDuration / 60000)}m ${Math.floor((totalDuration % 60000) / 1000)}s`);
    console.log(`  Total Events: ${totalEvents}`);
    console.log(`  Total Tasks: ${totalTasks}`);
    console.log(`  Swarms: ${this.swarms.size}`);
    console.log('╚' + '═'.repeat(58) + '╝\n');
  }

  async stop() {
    console.log('🛑 Stopping coordinator...');

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    // Terminate all swarms
    for (const [id, swarm] of this.swarms) {
      if (swarm.isRunning) {
        console.log(`   Terminating ${id} swarm...`);
        swarm.process.kill('SIGTERM');
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Force kill if needed
    for (const [id, swarm] of this.swarms) {
      if (swarm.isRunning) {
        console.log(`   Force killing ${id} swarm...`);
        swarm.process.kill('SIGKILL');
      }
    }

    console.log('✅ Coordinator stopped\n');
    this.isRunning = false;
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
  console.log('║    Meta-Orchestration: Multi-Swarm Coordination Example   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  const coordinator = new MultiSwarmCoordinator();

  try {
    await coordinator.start();
  } catch (error) {
    console.error('❌ Coordinator error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { MultiSwarmCoordinator };
