import { encode } from "@toon-format/toon";
import type { RepoContext } from "../context.js";
import { glabExec } from "../glab.js";

export const API_HELP = `usage: glab-axi api [<method>] <path> [flags]
Make an authenticated GitLab API request.
flags{api}:
  --field key=value (repeatable)
  --header key:value (repeatable)
  --input <file>
  --paginate
examples:
  glab-axi api user
  glab-axi api projects/:id/merge_requests`;

export async function apiCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  if (args.length === 0 || args[0] === "--help") {
    return API_HELP;
  }

  const output = await glabExec(["api", ...args], ctx);

  try {
    return encode(JSON.parse(output));
  } catch {
    return output.trimEnd();
  }
}
