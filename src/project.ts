import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { repoCommand } from "./repo.js";
import { searchCommand } from "./search.js";

export const PROJECT_HELP = `usage: glab-axi project <subcommand> [flags]
subcommands[2]:
  view, search
aliases:
  project view -> repo view
  project search -> search repos

examples:
  glab-axi project view
  glab-axi project search --search "cli tool"
`;

export async function projectCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return PROJECT_HELP;
  }

  if (subcommand === "view") {
    if (args.includes("--help")) {
      return PROJECT_HELP;
    }
    return repoCommand(args, ctx);
  }

  if (subcommand === "search") {
    if (args.includes("--help")) {
      return PROJECT_HELP;
    }
    return searchCommand(["repos", ...args.slice(1)], ctx);
  }

  throw new AxiError("Unknown project subcommand", "VALIDATION_ERROR", [
    "Run `glab-axi project view`",
    "Run `glab-axi project search`",
  ]);
}
