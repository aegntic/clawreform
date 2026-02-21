# AGENTZERO-INTEGRATION.md

**ClawReForm + AgentZero — Full Bleeding-Edge Orchestration Spec**  
**Version:** 1.0 (Feb 21 2026)  
**Goal:** Turn every AgentZero instance (and its entire hierarchical swarm) into glowing, living 3D crab armies on 3js.app.  
**Result:** ZeroClaw runs lean. AgentZero orchestrates like a warlord. ClawReForm visualizes, re-forms, and prints money.

## 1. AgentZero at a Glance (why this is the perfect warlord)
- Python-based, Docker-first, fully autonomous & organic framework (github.com/agent0ai/agent-zero)
- Dynamic & self-growing: not pre-programmed — learns your style, spawns sub-agents on demand, creates new tools via SKILL.md standard
- Hierarchical multi-agent: every agent has a superior (human or another agent) + spawns subordinates for parallel subtasks
- Real OS access: executes code/terminal, writes files, browses, searches, manages memory — the computer IS the tool
- Persistent Agentic RAG memory + dashboard + AI consolidation + project isolation (Git-based Projects with secrets, instructions, memory)
- Real-time: WebSocket streaming, A2A (Agent-to-Agent) protocol, MCP server/client for external tool integration
- Web UI at :50001 with scheduler, file editor, process grouping, TTS/STT
- Zero secrets: connect any LLM provider (OpenRouter, local Ollama, Bedrock, etc.) via LiteLLM without exposing keys
- Recent (Feb 18 2026): full SKILL.md skills system, Git Projects auth, sub-agent profiles, memory offload, A0_SET_ env vars

AgentZero is the brain. ZeroClaw is the muscle. ClawReForm is the eyes + battlefield.

## 2. Core Integration Architecture
**ClawReForm Edge Layer** (Cloudflare Workers + KV + your current stack)  
↓  
**AgentZero Instances** (Docker anywhere: local, VPS, swarm)  
↓  
**ZeroClaw Daemons** (lightweight runtime under the hood)  
↓  
**3js.app Claw3D Battlefield** (real-time WebSocket + Three.js)

### Connection Methods (all Day 1)
1. **Zero-Touch via MCP/A2A** — AgentZero exposes MCP server → ClawReForm connects as client, auto-discovers hierarchy
2. **WebSocket Hook** — Subscribe to AgentZero's real-time stream (docs/developer/websockets.md) for live events
3. **Project Import** — Drag Git repo or /a0 workdir into 3js.app → auto-parses agents, memory, skills, scheduler
4. **Env Sync** — Read A0_SET_* vars + providers.yaml for full config visualizer

## 3. Visual Mapping (the dopamine that prints $1M)
| AgentZero Concept          | Claw3D Visual                          | Re-Form Action in 3D                          |
|----------------------------|----------------------------------------|-----------------------------------------------|
| Top-level AgentZero        | Massive scarred alpha crab (warlord)   | Commands with glowing command-claw            |
| Sub-agent / subordinate    | Smaller swarm crabs                    | Spawn animation: warlord pinches egg → new crab erupts |
| Hierarchical task delegation | Chain of claw-to-claw high-fives       | Task orb travels down the chain               |
| Dynamic SKILL.md tool creation | New pincer grows from stump            | Organic claw mutation particles               |
| Persistent memory / RAG    | Neural vein network across swarm       | Veins pulse + consolidate on recall           |
| Task execution / code run  | Crab devours glowing code orb          | Explosion of success particles                |
| Scheduler / recurring task | Pulsing timer gland on crab back       | Gland fires → swarm synchronizes              |
| Policy/memory conflict     | Blade slices a pincer                  | Blood → dramatic organic re-growth + new skill |

Live collaborative: humans + AgentZero agents editing the 3D hierarchy together in real time on 3js.app.

## 4. Technical Implementation (copy-paste ready)

### 4.1 AgentZero Side (add to your Docker/.env)
```env
A0_SET_MCP_SERVER=true
A0_SET_WEBSOCKET_ENABLED=true
A0_SET_PROJECTS_ENABLED=true
# Point to ZeroClaw gateway for hybrid swarms
```

### 4.2 ClawReForm / 3js.app Side
```javascript
// 3js.app/src/integrations/agentzero.ts
import { io } from 'socket.io-client';
import * as THREE from 'three';

const swarmHierarchy = new Map(); // agentId → Crab3D + children[]

async function connectAgentZero(instanceUrl, projectId) {
  const socket = io(`${instanceUrl}/ws`, { auth: { projectId } });

  socket.on('agentSpawned', (data) => {
    const parentCrab = swarmHierarchy.get(data.parentId);
    const newCrab = spawnCrabModel(data);
    parentCrab.addSubCrab(newCrab);           // visual chain
    animatePincerGrowth(newCrab);             // new skill unlock
  });

  socket.on('toolCreated', (data) => {
    const crab = swarmHierarchy.get(data.agentId);
    crab.growNewPincer(data.skillName);       // dynamic mutation
  });

  socket.on('memoryConsolidated', (data) => {
    swarmHierarchy.get(data.agentId).pulseVeins(data.newMemories);
  });

  // Re-Form command
  socket.emit('reform', { 
    target: 'subagent-42',
    action: 'recover-from-context-overflow'
  });
}
```

One-click "Import AgentZero Project" button → full 3D hierarchy spawns instantly.

## 5. Swarm Orchestration Superpowers
- Hybrid ZeroClaw + AgentZero: AgentZero as brain spawns ZeroClaw daemons as muscle → visualized as warlord commanding blade-crabs
- Dynamic Growth Visuals: Every new SKILL.md = visible claw mutation in 3D
- Live Hierarchy Editor: Drag sub-agents in 3js.app → pushes new superior/subordinate relations back to AgentZero
- Memory Re-Form: Conflict in RAG? Watch the swarm auto-consolidate with glowing vein explosion + re-form
- Skool Classroom Mode: Students watch live AgentZero spawning 100 sub-agents while learning CLI-ReForm

## 6. Monetization Tie-In ($1M Path)
- Free: Connect 1 AgentZero instance + 5 sub-agents, basic hierarchy view
- Pro $49/mo: Unlimited hierarchy, dynamic skill visuals, one-click SKILL.md import
- Swarm Lord $149/mo: Full hybrid ZeroClaw orchestration, priority re-form, white-label war room
- Marketplace: Sell "AgentZero Swarm Templates", "Dynamic Pincer Shader Packs", "Memory Vein Presets" → 20% cut

One 15-second clip of a warlord crab spawning an army that instantly mutates new claws = 100k signups.

## 7. 48-Hour Execution Plan
- Tonight: Add AgentZero WebSocket/MCP listener to ClawReForm Workers + first hierarchy crab models
- Tomorrow: Ship 3js.app "Connect AgentZero Project" button + live spawn animation
- 72h: Update clawreform.com hero with hybrid ZeroClaw + AgentZero demo swarm
- Week 1 end: "AgentZero → 3D Warlord in 60 seconds" Skool module + X challenge

This is the feature that turns ClawReForm into the default visual nervous system for the entire organic agent swarm meta. ZeroClaw users get god visuals. AgentZero users get battlefield command. Non-CLI natives finally see what the hell their warlord is doing.
