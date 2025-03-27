import { McpServer } from "@mcp/sdk/server/mcp.js";
import { CallToolResultSchema } from "@mcp/sdk/server/types.js";
import { z } from "zod";

import { PDControl } from "@/pdControl.ts";
import { VERSION } from "@/types.ts";

/**
 * Creates and configures a new MCP server instance
 * @returns Configured MCP server with PD tools registered
 */
export function createServer(): McpServer {
    const server = new McpServer({
        name: "pd-mcp-ctl",
        version: VERSION,
    });

    registerTools(server);

    return server;
}

/**
 * Registers all PD-related tools with the MCP server
 * @param server The MCP server instance to register tools with
 */
export function registerTools(server: McpServer) {
    const pdControl = new PDControl();

    /**
     * Helper function to create read-only tools that execute specific PD commands
     * These tools don't accept parameters and return the raw result from pd-ctl
     *
     * @param name The name of the tool
     * @param description Human-readable description of the tool
     * @param command The PD command to execute
     */
    const createReadOnlyTool = (
        name: string,
        description: string,
        command: string,
    ) => {
        server.tool(name, description, async () => {
            const response: CallToolResultSchema = {
                content: [{
                    type: "text",
                    mimeType: "application/json",
                }],
            };
            try {
                const result = await pdControl.execute(command);
                response.content[0].text = JSON.stringify(result);
            } catch (error) {
                const err = error as Error;
                console.error(`Error getting ${name}`, err);
                response.content[0].text = JSON.stringify({
                    error: err.message,
                });
            }
            return response;
        });
    };

    // Register pre-defined read-only tools for common cluster operations
    createReadOnlyTool(
        "get-cluster-info",
        "Get the current cluster info",
        "cluster",
    );
    createReadOnlyTool(
        "get-store-info",
        "Get the current store info",
        "store",
    );
    createReadOnlyTool(
        "get-region-info",
        "Get the current region info",
        "region",
    );
    createReadOnlyTool(
        "get-config-info",
        "Get the current config info",
        "config show",
    );
    createReadOnlyTool(
        "get-health-info",
        "Get the current health info",
        "health",
    );
    createReadOnlyTool(
        "get-scheduler-info",
        "Get the current scheduler info",
        "scheduler show",
    );

    // Register a flexible tool that can execute any allowed command
    server.tool("execute-command", "Execute a command", {
        command: z.string(),
    }, async ({ command }) => {
        const response: CallToolResultSchema = {
            content: [{
                type: "text",
                mimeType: "application/json",
            }],
        };
        try {
            // Command validation is handled inside pdControl.execute
            const result = await pdControl.execute(command);
            response.content[0].text = JSON.stringify(result);
        } catch (error) {
            const err = error as Error;
            console.error(`Error executing ${command}:`, err);
            response.content[0].text = JSON.stringify({
                error: err.message,
            });
        }
        return response;
    });
}
