import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabExec, glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Issue = Record<string, unknown>;

export const ISSUE_HELP = `usage: glab-axi issue <subcommand> [flags]
subcommands[3]:
  list, view <number>, create

flags{list}:
  --output json

flags{create}:
  -t <text>, -m <milestone>, --label <name>, --web, --recover

examples:
  glab-axi issue list
  glab-axi issue create --title "Fix login"
`;

export const ISSUE_VIEW_HELP = `usage: glab-axi issue view <number> [flags]
Show issue details.

flags{view}:
  --comments, --output json

examples:
  glab-axi issue view 42
  glab-axi issue view 42 --comments
`;

export const ISSUE_CREATE_HELP = `usage: glab-axi issue create [flags]
Create an issue in the current project.

examples:
  glab-axi issue create --title "Fix login"
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

  if (subcommand === "create") {
    if (wantsHelp) {
      return ISSUE_CREATE_HELP;
    }

    const output = await glabExec(["issue", "create", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi issue create --help` for glab flags"]),
    ]);
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown issue subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi issue list`, `glab-axi issue view <number>`, or `glab-axi issue create`",
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
