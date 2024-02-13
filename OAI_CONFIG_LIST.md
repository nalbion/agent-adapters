# OAI_CONFIG_LIST

The `OAI_CONFIG_LIST.json` file is shared with [AutoGen] and allows you to keep your API keys separate from the `agent.yml` file which you may want to share with others.

You can also define `base_url`, `api_type`, `api_version` for use with Open Source models.

You can get your Open AI API key from the [API keys](https://platform.openai.com/api-keys) section in the platform site.

The `model` names here are sent to the Chat Completion service, so must match with the model names they use.

Example:

```json
[
  {
    "model": "gpt-4",
    "api_key": "sk-1234"
  },
  {
    "model": "gpt-4-1106-preview",
    "api_key": "sk-7890"
  }
]
```

[AutoGen]: https://github.com/microsoft/autogen
