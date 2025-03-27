/**
 * Environment variable names for configuration
 */
const PD_ENDPOINT_ENV_VAR = "PD_ENDPOINT";
const PD_CTL_PATH_ENV_VAR = "PD_CTL_PATH";

/**
 * Default configuration values
 */
const DEFAULT_PD_ENDPOINT = "http://127.0.0.1:2379";
const DEFAULT_PD_CTL_PATH = "pd-ctl";

/**
 * PD Control configuration
 * Contains settings for connecting to and interacting with the PD server
 */
export const config = {
    /**
     * PD endpoint URL (can be overridden with PD_ENDPOINT env var)
     * Default: http://127.0.0.1:2379
     */
    pdEndpoint: Deno.env.get(PD_ENDPOINT_ENV_VAR) || DEFAULT_PD_ENDPOINT,

    /**
     * Path to pd-ctl executable (can be overridden with PD_CTL_PATH env var)
     * Default: pd-ctl (assumes it's in PATH)
     */
    pdCtlPath: Deno.env.get(PD_CTL_PATH_ENV_VAR) || DEFAULT_PD_CTL_PATH,

    /**
     * List of allowed commands for security
     * Any command not in this list will be rejected
     */
    allowedCommands: [
        "cluster",
        "config",
        "health",
        "hot",
        "member",
        "operator",
        "region",
        "scheduler",
        "store",
    ],
};
