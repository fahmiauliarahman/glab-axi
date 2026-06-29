import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Project = {
  path_with_namespace?: string;
  web_url?: string;
  description?: string;
};

export const SEARCH_HELP = `usage: glab-axi search repos [flags]
Search projects.

flags{repos}:
  --output json
  -s, --search string

examples:
  glab-axi search repos --search "cli tool"
`;

export async function searchCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return SEARCH_HELP;
  }

  if (subcommand !== "repos") {
    throw new AxiError("Unknown search subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi search repos`",
    ]);
  }

  if (args.includes("--help")) {
    return SEARCH_HELP;
  }

  const repos = await glabJson<Project[]>(
    ["repo", "search", "--output", "json", ...args.slice(1)],
    ctx,
  );

  return renderOutput([
    `repos:\n  ${encode(repos).replaceAll("\n", "\n  ")}`,
    renderHelp(["Use `glab-axi search repos --help` for glab flags"]),
  ]);
}
