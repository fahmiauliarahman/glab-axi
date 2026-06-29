import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderKeyValueBlock, renderOutput } from "./toon.js";

type Repo = {
  path_with_namespace?: string;
  web_url?: string;
  description?: string;
};

export const REPO_HELP = `usage: glab-axi repo view [flags]
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

  if (subcommand !== "view") {
    throw new AxiError("Unknown repo subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi repo view`",
    ]);
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
