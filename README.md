# agent-adapters

Framework for configurable AI Agents.

Inspired by with [AutoGen](https://github.com/microsoft/autogen) and compatible with [AIConfig](https://aiconfig.lastmileai.dev/) and [Agent Protocol](https://agentprotocol.ai/). Can also download invoke and invoke arbitrary Agents as a subprocess.

## Installation

To install this library, you can use npm:

```
npm install agent-adapters
```

## Usage

Import the library in your TypeScript/JavaScript file:

```typescript
import { readAgentConfig, createAgent } from "agent-adapters";
```

## agents.yml

The `agents.yml` file is inspired by [AutoGen](https://github.com/microsoft/autogen) and is compatible with [AIConfig](https://aiconfig.lastmileai.dev/), with the additional condition that the `description` field must be provided as it is used by GitHub Copilot Chat and LLM-based routing.

`createAgent()` uses some of the optional properties of the `AgentConfig` to determine which type of Agent to create:

- `agent.routing.team` -> `RouterAgent` - see **Routing** below.
- `agent.remote` -> `AgentProtocolAgent` - refer [agentprotocol.ai](https://agentprotocol.ai/)
- `agent.cli.command` -> `CliClientAgent` - executes an Agent from a command line (useful for calling Python agents from Node.JS etc)
- `agent.llm_config.config_list` -> If an LLM has been configured will use OpenAI, local LLMs etc
- If No LLM has been configured, will attempt to use GitHub Copilot

If `agent.vscode === true` the Agent will be available by mentioning it by `@{name}` in VS Github Copilot Chat (when [ChatAgents2 proposal](https://code.visualstudio.com/api/advanced-topics/using-proposed-api#using-a-proposed-api) is released).

### Routing

All Agents automatically register themselves with the `AgentRegistry` upon construction.
Agents may use `AgentRegistry.searchAgents()` to search by name or `role`, and matching Agents will be ranked based on the `context`.

Note: Name your agents carefully - if an Agent attempts to send a message to another Agent by `role` (eg "developer") and an Agent exists with a **name** matching that role, it will receive the message.

- role: "developer", "tester" etc
- context: `{ language: ["javascript", "typescript"], platform: ["web"], framework: ["react"], ... }`

## Development

To develop this library, you need to have Node.js and npm installed. After cloning the repository, install the dependencies:

```
npm install
```

You can then run the tests:

```
npm test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[Mozilla Public License 2.0](https://choosealicense.com/licenses/mpl-2.0/)
