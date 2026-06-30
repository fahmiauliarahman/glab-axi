import { AxiError } from "./errors.js";
import type { RepoContext } from "./context.js";
import { repoCommand } from "./commands/repo.js";
import { searchCommand } from "./commands/search.js";

export const PROJECT_HELP = `usage: glab-axi project <subcommand> [flags]
subcommands[4]:
  view, search, find, lookup
aliases:
  project view -> repo view
  project search -> search repos
  project find -> search repos
  project lookup -> search repos
examples:
  glab-axi project view
  glab-axi project search --search "cli tool"
  glab-axi project find --search "cli tool"`;

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

  if (
    subcommand === "search" ||
    subcommand === "find" ||
    subcommand === "lookup"
  ) {
    if (args.includes("--help")) {
      return PROJECT_HELP;
    }
    return searchCommand(["repos", ...args.slice(1)], ctx);
  }

  throw new AxiError("Unknown project subcommand", "VALIDATION_ERROR", [
    "Run `glab-axi project view`",
    "Run `glab-axi project search`",
    "Run `glab-axi project find`",
    "Run `glab-axi project lookup`",
  ]);
}
