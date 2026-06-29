import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { searchCommand } from "./search.js";
import { renderHelp, renderKeyValueBlock, renderOutput } from "./toon.js";

type Repo = {
  path_with_namespace?: string;
  web_url?: string;
  description?: string;
};

export const REPO_HELP = `usage: glab-axi repo <subcommand> [flags]
subcommands[5]:
  list, search, find, lookup, view

flags{list}:
  --output json

flags{search}:
  --output json
  -s, --search string

flags{view}:
  --output json

examples:
  glab-axi repo list
  glab-axi repo search --search "cli tool"
  glab-axi repo view
`;

export const REPO_LIST_HELP = `usage: glab-axi repo list [flags]
List repositories.

flags{list}:
  --output json

examples:
  glab-axi repo list
`;

export const REPO_SEARCH_HELP = `usage: glab-axi repo search [flags]
Search projects.

flags{search}:
  --output json
  -s, --search string

aliases:
  find
  lookup

examples:
  glab-axi repo search --search "cli tool"
  glab-axi repo find --search "cli tool"
`;

export const REPO_VIEW_HELP = `usage: glab-axi repo view [flags]
View current project metadata.

flags{view}:
  --output json

examples:
  glab-axi repo view
`;

export async function repoCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return REPO_HELP;
  }

  if (subcommand === "list") {
    if (args.includes("--help") || args.includes("-h")) {
      return REPO_LIST_HELP;
    }

    const repos = await glabJson<Repo[]>(
      ["repo", "list", "--output", "json"],
      ctx,
    );

    return renderOutput([
      `repos:\n  ${encode(repos).replaceAll("\n", "\n  ")}`,
      renderHelp(["Use `glab-axi repo list --help` for glab flags"]),
    ]);
  }

  if (
    subcommand === "search" ||
    subcommand === "find" ||
    subcommand === "lookup"
  ) {
    if (args.includes("--help") || args.includes("-h")) {
      return REPO_SEARCH_HELP;
    }

    return searchCommand(["repos", ...args.slice(1)], ctx);
  }

  if (subcommand !== "view") {
    throw new AxiError("Unknown repo subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi repo list`",
      "Run `glab-axi repo search`",
      "Run `glab-axi repo view`",
    ]);
  }

  if (args.includes("--help") || args.includes("-h")) {
    return REPO_VIEW_HELP;
  }

  const repo = await glabJson<Repo>(["repo", "view", "--output", "json"], ctx);

  const blocks: string[] = [];

  if (repo.path_with_namespace) {
    blocks.push(renderKeyValueBlock("project", repo.path_with_namespace));
  }

  if (repo.web_url) {
    blocks.push(renderKeyValueBlock("web", repo.web_url));
  }

  if (repo.description) {
    blocks.push(renderKeyValueBlock("description", repo.description));
  }

  blocks.push(renderHelp(["Use `glab-axi repo view --help` for glab flags"]));

  return renderOutput(blocks);
}
