import { config } from "@/config.ts";
import { PDControlResponse } from "@/types.ts";

/**
 * Abstracts command execution to allow for mocking in tests
 */
export interface CommandExecutor {
    /**
     * Execute a command with the given arguments
     * @param command The command to execute
     * @param args The arguments to pass to the command
     * @returns Promise resolving to execution result with exit code, stdout and stderr
     */
    execute(
        command: string,
        args: string[],
    ): Promise<{ code: number; stdout: Uint8Array; stderr: Uint8Array }>;
}

/**
 * Default command executor for executing pd-ctl commands
 * Uses `Deno.Command` to execute commands on the system
 */
export class DefaultCommandExecutor implements CommandExecutor {
    async execute(
        command: string,
        args: string[],
    ): Promise<{ code: number; stdout: Uint8Array; stderr: Uint8Array }> {
        const cmd = new Deno.Command(command, {
            args,
            stdout: "piped",
            stderr: "piped",
        });
        return await cmd.output();
    }
}

/**
 * PD Control client for interacting with the PD server via executing the pd-ctl commands
 * Provides a secure interface to execute allowed commands against the PD server
 */
export class PDControl {
    private readonly pdEndpoint: string;
    private readonly pdCtlPath: string;
    private readonly commandExecutor: CommandExecutor;

    constructor(
        commandExecutor: CommandExecutor = new DefaultCommandExecutor(),
    ) {
        this.pdEndpoint = config.pdEndpoint;
        this.pdCtlPath = config.pdCtlPath;
        this.commandExecutor = commandExecutor;
    }

    /**
     * Execute a PD Control command
     *
     * @param command The command to execute
     * @returns The parsed command result
     */
    async execute(command: string): Promise<PDControlResponse> {
        try {
            // Validate command against allowed commands
            const commandParts = command.split(" ");
            const baseCommand = commandParts[0];

            // Security check: only allow commands explicitly listed in config
            // This prevents arbitrary command execution
            if (!config.allowedCommands.includes(baseCommand)) {
                throw new Error(`Command "${baseCommand}" is not allowed`);
            }

            // Execute the command using the executor
            const { code, stdout, stderr } = await this.commandExecutor.execute(
                this.pdCtlPath,
                ["-u", this.pdEndpoint, ...commandParts],
            );

            if (code !== 0) {
                const errorText = new TextDecoder().decode(stderr);
                throw new Error(`PD Control command failed: ${errorText}`);
            }

            return this.parseCommandOutput(new TextDecoder().decode(stdout));
        } catch (error) {
            const err = error as Error & { stderr?: string };

            // Create structured error response
            const errorResponse: PDControlResponse = {
                success: false,
                error: err.message,
                command: command,
                stderr: err.stderr,
            };

            return errorResponse;
        }
    }

    /**
     * Parse the command output into a structured format
     * Handles different output formats from pd-ctl commands:
     * - JSON objects/arrays: parsed as JSON
     * - Simple success messages: returned as string
     * - Other text output: returned as string
     *
     * @param output Raw command output
     * @returns Parsed command result with appropriate structure
     */
    private parseCommandOutput(output: string): PDControlResponse {
        try {
            // Try to parse as JSON first
            const trimmedOutput = output.trim();

            // If output looks like JSON, parse it
            if (
                trimmedOutput.startsWith("{") || trimmedOutput.startsWith("[")
            ) {
                return {
                    success: true,
                    result: JSON.parse(trimmedOutput),
                };
            }

            // Handle special success messages
            if (trimmedOutput === "Success!") {
                return {
                    success: true,
                    result: "Success!",
                };
            }

            // Handle non-JSON output as plain text
            return {
                success: true,
                result: trimmedOutput,
            };
        } catch (error) {
            const err = error as Error;
            console.warn("Failed to parse PD Control command output", {
                error: err.message,
            });

            // Return raw output if parsing fails
            return {
                success: true,
                result: output.trim(),
            };
        }
    }
}
