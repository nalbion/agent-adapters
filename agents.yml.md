# agents.yml Usage Guide

The `agents.yml` configuration file is inspired by [AutoGen] and is compatible with [AIConfig], with the additional condition that the `description` field must be provided as it is used by GitHub Copilot Chat and LLM-based routing.

When this extension first starts up, it will look in the following locations for an `agents.yml` file in the your home directory and in `~/.agents/`. If it does not find one it will create a new default config file.

You can ask to see your config file at any time:

> @agents /config

Any changes to this file will be immediately applied.

This extension will also scan for and read any [AIConfig] files (ending in `aiconfig.json`) in `~/` and `~/.agents/`.

# Structure of agents.yml

## config_list

This section is used to define the models and their corresponding [API keys](https://platform.openai.com/api-keys). For example:

```yaml
config_list:
  - model: gpt-4
    api_key: YOUR_API_KEY
  - model: gpt-3.5-turbo
    api_key: YOUR_API_KEY
```

This section is _optional_ if you have a `OAI_CONFIG_LIST` environment variable or JSON file in `~/` or `~/.agents/` which could be shared by [AutoGen] and other libraries/frameworks.

## agents

`Copilot Agents` uses some of the optional properties of the `agent` descriptors to determine which type of Agent to create:

- `agent.routing.team` creates a `RouterAgent` - see **Routing** below.
- `agent.remote` creates an `AgentProtocolAgent` - refer [agentprotocol.ai](https://agentprotocol.ai)
- `agent.cli.command` creates a `CliClientAgent` - executes an Agent from a command line (useful for calling Python agents from Node.JS etc)
- `agent.llm_config.config_list` - If an LLM has been configured the agent will use OpenAI, local LLMs etc
- If No LLM has been configured, will attempt to use GitHub Copilot's chat completion service.

If `agent.vscode === true`

## Agent Properties

Each agent can have the following properties:

- `name`: The name of the agent. `/[a-zA-Z_]+/` - avoid dots, slashes etc.
- `description`: This will appear after the agent name when you mention it by `@name`.
- `schema_version`: Required, only if you want to use with [AIConfig]
- `metadata`: Skip this unless you're using with [AIConfig]
- `prompts`: Named prompts which your model can use. Some of the agents provided by this extension attempt to use a prompt named `background`.

- `vscode`: Set to `true` to have the Agent available by mentioning it by `@{name}` in VS Github Copilot Chat.
- `icon`: One of the [VS Code icon codes](https://code.visualstudio.com/api/references/icons-in-labels#icon-listing) or a URL to an online image.
- `models`: A list of model names to filter - eg `['gpt-4', 'gpt-3.5-turbo']`
  These reference models defined in `agents[i].metadata.models`, `config_list` and `OAI_CONFIG_LIST`.
- `sample_request`: When the user clicks this agent in `/help`, this text will be submitted to this slash command.
- `commands`: A list of `{ name, description }` and optionally `sampleRequest`. The agent needs to be coded to process these.

The `metadata/models` section can be used to give aliases to the models, eg:

```yaml
agents:
  - name: 10xDeveloper
    description: An experienced software developer
    metadata:
      default_model: default
      models:
        default:
          model: gpt-4
          temperature: 0.5
        fast:
          model: gpt-3.5-turbo
          temperature: 0.1
        fun:
          model: gpt-3.5-turbo
          temperature: 2.0
```

## Agent Protocol

You can connect to an Agent running locally or remotely using `agents[i]/remote`.

Example:

```yaml
 - name: AutoGPT
    description: The power of AI accessible to everyone
    icon: https://avatars.githubusercontent.com/u/130738209?s=32
    vscode: true
    remote:
      base_url: http://localhost:8000
```

## Agent as CLI Process

You can spawn a new process to run an Agent written in any language.

```yaml
- name: evo_ninja
  description: Research, analyse and build software
  icon: https://evo.ninja/favicon.ico
  vscode: true
  git:
    repo: https://github.com/polywrap/evo.ninja
    branch: dev
    baseDir: ~/.agents/evo.ninja
  cli:
    command: cmd.exe
    args: ["/K", "yarn", "start"]
    cwd: ~/.agents/evo.ninja
    wait_for: "Enter another goal: "
```

The example above downloads and installs the agent from source, pulling the latest changes on every launch.

# Routing

All Agents automatically register themselves with the `AgentRegistry` upon construction.

_Note_: Name your agents carefully - if an Agent attempts to send a message to another Agent by `role` (eg "developer") and an Agent exists with a **name** matching that role, it will receive the message.

The RouterAgent and WorkflowManager use context fields to determine which Agent to route each user message to.

For example, a request to "create a new react web app" may result in the following context fields being set:

- role: "developer", "tester" etc
- language: ["javascript", "typescript"]
- platform: ["web"]
- framework: ["react"]

[AIConfig]: https://aiconfig.lastmileai.dev/
[AutoGen]: https://github.com/microsoft/autogen
