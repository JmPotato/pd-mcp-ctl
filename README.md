# pd-mcp-ctl

Connects the Model Context Protocol (MCP) with PD Control, enabling LLMs to interact with and manage TiKV cluster efficiently and intelligently.

## Prerequisites

- [Deno](https://deno.land/)
- Access to a TiKV cluster with PD Control

## Usage

1. Clone the repository:

```bash
git clone https://github.com/JmPotato/pd-mcp-ctl.git
cd pd-mcp-ctl
```

2. Compile:

```bash
deno run build
./dist/pd-mcp-ctl --help
```

3. Take [Claude Desktop](https://claude.ai/download) as an example, edit your `claude_desktop_config.json` like:

```json
{
    "mcpServers": {
        "pd-mcp-ctl": {
            "command": "{PATH_TO_PD_MCP_CTL_REPO}/dist/pd-mcp-ctl",
            "args": [
                "stdio"
            ],
            "env": {
                "PD_ENDPOINT": "http://127.0.0.1:2379",
                "PD_CTL_PATH": "{PATH_TO_PD_CTL_BINARY}"
            }
        }
    }
}
```

More details can be found in [Model Context Protocol Docs](https://modelcontextprotocol.info/docs/quickstart/user).

## Implemented MCP Tools

| Tool Name | Description |
|-----------|-------------|
| execute-command | Execute any pd-ctl command |
| get-cluster-info | Get the current cluster info |
| get-config-info | Get the current config info |
| get-health-info | Get the current health info |
| get-region-info | Get the current region info |
| get-scheduler-info | Get the current scheduler info |
| get-store-info | Get the current store info |

## License

MIT License - see the [LICENSE](LICENSE) file for details.
