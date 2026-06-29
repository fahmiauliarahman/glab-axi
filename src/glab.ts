import { execFile } from "node:child_process";
import type { RepoContext } from "./context.js";
import { AxiError } from "axi-sdk-js";

const MAX_BUFFER_BYTES = 10 * 1024 * 1024;

function buildArgs(args: string[], ctx?: RepoContext): string[] {
  const out = [...args];
  if (ctx && ctx.source !== "git") {
    out.push("--repo", ctx.nwo);
  }
  return out;
}

function run(
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    execFile(
      "glab",
      args,
      { maxBuffer: MAX_BUFFER_BYTES },
      (error, stdout, stderr) => {
        if (error && (error as NodeJS.ErrnoException).code === "ENOENT") {
          resolve({ stdout: "", stderr: "ENOENT", exitCode: 127 });
          return;
        }

        const exitCode = error
          ? ((error as Error & { code?: string | number }).code ?? 1)
          : 0;
        resolve({
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          exitCode: typeof exitCode === "number" ? exitCode : 1,
        });
      },
    );
  });
}

export async function glabJson<T = unknown>(
  args: string[],
  ctx?: RepoContext,
): Promise<T> {
  const result = await run(buildArgs(args, ctx));
  if (result.exitCode !== 0) {
    throw new AxiError(
      result.stderr.trim() || result.stdout.trim() || "glab failed",
      "UNKNOWN",
    );
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new AxiError(
      `Unexpected glab output: ${result.stdout.slice(0, 200)}`,
      "UNKNOWN",
    );
  }
}
