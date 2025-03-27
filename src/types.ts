// TODO: Use the version from the deno.json
export const VERSION = "0.1.0";

/**
 * Response from a PD Control command
 * Contains the success status and either result or error information
 */
export interface PDControlResponse {
    /** Whether the command execution was successful */
    success: boolean;
    /** The command result if successful - can be string or JSON object */
    result?: string | object;
    /** Error message if command failed */
    error?: string;
    /** The original command that was executed */
    command?: string;
    /** Standard error output from the command, if any */
    stderr?: string;
}
