import { assertEquals } from "@std/assert";

import { CommandExecutor, PDControl } from "@/pdControl.ts";

class MockCommandExecutor implements CommandExecutor {
    lastCommand: { command: string; args: string[] } | null = null;

    execute(
        command: string,
        args: string[],
    ): Promise<{ code: number; stdout: Uint8Array; stderr: Uint8Array }> {
        this.lastCommand = { command, args };

        // Simulate different responses based on command
        if (args.includes("health")) {
            return Promise.resolve({
                code: 0,
                stdout: new TextEncoder().encode('{"health": "ok"}'),
                stderr: new TextEncoder().encode(""),
            });
        }
        if (args.includes("store")) {
            return Promise.resolve({
                code: 1,
                stdout: new TextEncoder().encode(""),
                stderr: new TextEncoder().encode("command not found"),
            });
        }
        return Promise.resolve({
            code: 0,
            stdout: new TextEncoder().encode("success"),
            stderr: new TextEncoder().encode(""),
        });
    }
}

Deno.test("PDControl - successful command execution", async () => {
    const mockExecutor = new MockCommandExecutor();
    const pdControl = new PDControl(mockExecutor);
    const result = await pdControl.execute("health");

    assertEquals(result.success, true);
    assertEquals(result.result, { health: "ok" });
    assertEquals(mockExecutor.lastCommand?.command, "pd-ctl");
    assertEquals(mockExecutor.lastCommand?.args, [
        "-u",
        "http://127.0.0.1:2379",
        "health",
    ]);
});

Deno.test("PDControl - command validation", async () => {
    const mockExecutor = new MockCommandExecutor();
    const pdControl = new PDControl(mockExecutor);

    // Test disallowed command
    const result = await pdControl.execute("unsafe");
    assertEquals(result.success, false);
    assertEquals(result.error, 'Command "unsafe" is not allowed');
    assertEquals(result.command, "unsafe");
});

Deno.test("PDControl - command failure handling", async () => {
    const mockExecutor = new MockCommandExecutor();
    const pdControl = new PDControl(mockExecutor);

    // Test that "invalid" is not an allowed command
    const result1 = await pdControl.execute("invalid");
    assertEquals(result1.success, false);
    assertEquals(result1.error, 'Command "invalid" is not allowed');
    assertEquals(result1.command, "invalid");

    // Test an allowed command that fails during execution
    const result2 = await pdControl.execute("store");
    assertEquals(result2.success, false);
    assertEquals(result2.error, "PD Control command failed: command not found");
    assertEquals(result2.command, "store");
});
