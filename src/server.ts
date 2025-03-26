import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { VERSION } from "@/types.ts";

export function createServer(): McpServer {
    const server = new McpServer({
        name: "pd-mcp-ctl",
        version: VERSION,
    });

    registerResources(server);
    registerTools(server);

    return server;
}

export function registerResources(server: McpServer) {
}

export function registerTools(server: McpServer) {
}
