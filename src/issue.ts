import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabExec, glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Issue = Record<string, unknown>;

export const ISSUE_HELP = `usage: glab-axi issue <subcommand> [flags]
subcommands[9]:
  list, view <number>, create, note <number>, comment <number>, update <number>, close <number>, delete <number>, reopen <number>, open <number>

flags{list}:
  --output json

flags{create}:
  -t <text>, -m <milestone>, --label <name>, --web, --recover

examples:
  glab-axi issue list
  glab-axi issue create --title "Fix login"
  glab-axi issue note 42 -m "closing because !123 was merged"
  glab-axi issue comment 42 -m "closing because !123 was merged"
  glab-axi issue delete 42
  glab-axi issue reopen 42
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

export const ISSUE_NOTE_HELP = `usage: glab-axi issue note <number> [flags]
Add a note to an issue.

flags{note}:
  -m, --message <text>

examples:
  glab-axi issue note 42 -m "closing because !123 was merged"
`;

export const ISSUE_UPDATE_HELP = `usage: glab-axi issue update <number> [flags]
Update issue fields.

flags{update}:
  --title, --description, --label, --unlabel, --assignee, --milestone, --confidential, --public

examples:
  glab-axi issue update 42 --label bug
`;

export const ISSUE_CLOSE_HELP = `usage: glab-axi issue close <number> [flags]
Close an issue.

examples:
  glab-axi issue close 42
`;

export const ISSUE_DELETE_HELP = `usage: glab-axi issue delete <number> [flags]
Delete an issue.

examples:
  glab-axi issue delete 42
`;

export const ISSUE_REOPEN_HELP = `usage: glab-axi issue reopen <number> [flags]
Reopen a closed issue.

examples:
  glab-axi issue reopen 42
  glab-axi issue open 42
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

  if (subcommand === "note" || subcommand === "comment") {
    if (wantsHelp) {
      return ISSUE_NOTE_HELP;
    }

    const output = await glabExec(["issue", "note", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi issue note --help` for glab flags"]),
    ]);
  }

  if (subcommand === "update") {
    if (wantsHelp) {
      return ISSUE_UPDATE_HELP;
    }

    const output = await glabExec(["issue", "update", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi issue update --help` for glab flags"]),
    ]);
  }

  if (subcommand === "close") {
    if (wantsHelp) {
      return ISSUE_CLOSE_HELP;
    }

    const output = await glabExec(["issue", "close", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi issue close --help` for glab flags"]),
    ]);
  }

  if (subcommand === "delete" || subcommand === "del") {
    if (wantsHelp) {
      return ISSUE_DELETE_HELP;
    }

    const output = await glabExec(["issue", "delete", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi issue delete --help` for glab flags"]),
    ]);
  }

  if (subcommand === "reopen" || subcommand === "open") {
    if (wantsHelp) {
      return ISSUE_REOPEN_HELP;
    }

    const output = await glabExec(["issue", "reopen", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi issue reopen --help` for glab flags"]),
    ]);
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown issue subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi issue list`, `glab-axi issue view <number>`, `glab-axi issue create`, `glab-axi issue note <number>`, `glab-axi issue comment <number>`, `glab-axi issue update <number>`, `glab-axi issue close <number>`, `glab-axi issue delete <number>`, or `glab-axi issue reopen <number>`",
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
