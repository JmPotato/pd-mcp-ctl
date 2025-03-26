import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Command } from "@cliffy/command";

import { VERSION } from "@/types.ts";
import { createServer } from "@/server.ts";

await new Command()
    .name("pd-mcp-ctl")
    .version(VERSION)
    .description(
        "CLI for managing and dispatching the pd-mcp-ctl server",
    )
    .command("stdio", "Start the MCP server with stdio transport")
    .action(async () => {
        await startStdioServer();
    })
    .command("http", "Start the MCP server with HTTP/SSE transport")
    .action(() => {
        startHttpServer();
    })
    .parse(Deno.args);

/**
 * Start the MCP server with stdio transport (for command line usage)
 */
async function startStdioServer() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

/**
 * Start the MCP server with HTTP/SSE transport (for web usage)
 */
function startHttpServer() {
    const app = express();
    const SSE_PORT = 2499;

    // to support multiple simultaneous connections we have a lookup object from
    // sessionId to transport
    const transports: { [sessionId: string]: SSEServerTransport } = {};

    app.get("/sse", async (_: Request, res: Response) => {
        const server = createServer();
        const transport = new SSEServerTransport("/messages", res);
        transports[transport.sessionId] = transport;
        res.on("close", () => {
            delete transports[transport.sessionId];
        });
        await server.connect(transport);
    });

    app.post("/messages", async (req: Request, res: Response) => {
        const sessionId = req.query.sessionId as string;
        const transport = transports[sessionId];
        if (transport) {
            await transport.handlePostMessage(req, res);
        } else {
            res.status(400).send("No transport found for sessionId");
        }
    });

    app.listen(SSE_PORT, () => {
        console.info(`pd-mcp-ctl SSE server listening on port ${SSE_PORT}`);
    });
}
