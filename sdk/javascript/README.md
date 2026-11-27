# @clawreform/sdk

Official JavaScript/TypeScript client for the [ClawReform](https://clawreform.com) Agent OS REST API.

## Installation

```bash
npm install @clawreform/sdk
```

## Quick Start

```javascript
const { ClawReform } = require("@clawreform/sdk");

// Connect to your ClawReform server
const client = new ClawReform("http://127.0.0.1:4332");

// Check health
const health = await client.health();
console.log(health);

// Create an agent
const agent = await client.agents.create({ template: "assistant" });
console.log("Created agent:", agent.id);

// Send a message
const reply = await client.agents.message(agent.id, "Hello, ClawReform!");
console.log(reply);

// Stream a response
for await (const event of client.agents.stream(agent.id, "Tell me a joke")) {
  if (event.delta) process.stdout.write(event.delta);
}
```

## API

### Constructor

```javascript
const client = new ClawReform(baseUrl?, opts?);
```

- `baseUrl` - ClawReform server URL (default: `http://127.0.0.1:4332`)
- `opts.headers` - Custom headers for all requests

### Resources

| Resource | Description |
|----------|-------------|
| `client.agents` | Agent management (create, message, stream, delete) |
| `client.sessions` | Session management |
| `client.workflows` | Workflow execution |
| `client.skills` | Skill installation and search |
| `client.channels` | Channel configuration |
| `client.tools` | Tool listing |
| `client.models` | Model catalog |
| `client.providers` | LLM provider management |
| `client.memory` | Agent memory (KV store) |
| `client.triggers` | Event triggers |
| `client.schedules` | Scheduled tasks |

### Agents

```javascript
// List all agents
const agents = await client.agents.list();

// Create an agent
const agent = await client.agents.create({
  template: "assistant",
  name: "My Agent"
});

// Get agent details
const details = await client.agents.get(agent.id);

// Send a message (returns full response)
const reply = await client.agents.message(agent.id, "Hello!");

// Stream a message (async iterator)
for await (const event of client.agents.stream(agent.id, "Hello!")) {
  console.log(event);
}

// Delete an agent
await client.agents.delete(agent.id);
```

### Error Handling

```javascript
const { ClawReformError } = require("@clawreform/sdk");

try {
  await client.agents.get("nonexistent");
} catch (err) {
  if (err instanceof ClawReformError) {
    console.log("Status:", err.status);
    console.log("Body:", err.body);
  }
}
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- ClawReform server running locally or remotely

## License

MIT
