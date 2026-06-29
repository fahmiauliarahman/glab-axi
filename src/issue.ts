import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Issue = Record<string, unknown>;

export const ISSUE_HELP = `usage: glab-axi issue list [flags]
List project issues.

flags{list}:
  --output json

examples:
  glab-axi issue list
`;

export const ISSUE_VIEW_HELP = `usage: glab-axi issue view <number> [flags]
Show issue details.

flags{view}:
  --comments, --output json

examples:
  glab-axi issue view 42
  glab-axi issue view 42 --comments
`;

export async function issueCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];
  const wantsHelp = args.includes("--help") || args.includes("-h");

  if (subcommand === undefined || subcommand === "--help") {
    return ISSUE_HELP;
  }

  if (subcommand === "view") {
    if (wantsHelp) {
      return ISSUE_VIEW_HELP;
    }

    const issue = await glabJson<Issue>(
      ["issue", "view", ...args.slice(1), "--output", "json"],
      ctx,
    );

    return renderOutput([
      `issue:\n  ${encode(issue).replaceAll("\n", "\n  ")}`,
      renderHelp(["Use `glab-axi issue view --help` for glab flags"]),
    ]);
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown issue subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi issue list` or `glab-axi issue view <number>`",
    ]);
  }

  const issues = await glabJson<Issue[]>(
    ["issue", "list", "--output", "json"],
    ctx,
  );

  return renderOutput([
    `issues:\n  ${encode(issues).replaceAll("\n", "\n  ")}`,
    renderHelp(["Use `glab-axi issue list --help` for glab flags"]),
  ]);
}
