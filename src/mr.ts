import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabExec, glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type MergeRequest = Record<string, unknown>;

export const MR_HELP = `usage: glab-axi mr <subcommand> [flags]
subcommands[3]:
  list, view <number>, create, merge <number>
flags{list}:
  --output json
flags{view}:
  --comments, --output json
flags{create}:
  -t <text>, -m <milestone>, --label <name>, --web, --recover, --remove-source-branch
flags{merge}:
  --merge-when-pipeline-succeeds, --remove-source-branch
examples:
  glab-axi mr list
  glab-axi mr view 42
  glab-axi mr create --title "Ship it"
  glab-axi mr merge 42
`;

export const MR_VIEW_HELP = `usage: glab-axi mr view <number> [flags]
Show merge request details.

flags{view}:
  --comments, --output json

examples:
  glab-axi mr view 42
  glab-axi mr view 42 --comments
`;

export const MR_CREATE_HELP = `usage: glab-axi mr create [flags]
Create a merge request in the current project.

examples:
  glab-axi mr create --title "Ship it"
`;

export const MR_MERGE_HELP = `usage: glab-axi mr merge <number> [flags]
Merge a merge request.

examples:
  glab-axi mr merge 42
`;

export async function mrCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];
  const wantsHelp = args.includes("--help") || args.includes("-h");

  if (subcommand === undefined || subcommand === "--help") {
    return MR_HELP;
  }

  if (subcommand === "view") {
    if (wantsHelp) {
      return MR_VIEW_HELP;
    }

    const mergeRequest = await glabJson<MergeRequest>(
      ["mr", "view", ...args.slice(1), "--output", "json"],
      ctx,
    );

    return renderOutput([
      `mr:\n  ${encode(mergeRequest).replaceAll("\n", "\n  ")}`,
      renderHelp(["Use `glab-axi mr view --help` for glab flags"]),
    ]);
  }

  if (subcommand === "create") {
    if (wantsHelp) {
      return MR_CREATE_HELP;
    }

    const output = await glabExec(["mr", "create", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi mr create --help` for glab flags"]),
    ]);
  }

  if (subcommand === "merge") {
    if (wantsHelp) {
      return MR_MERGE_HELP;
    }

    const output = await glabExec(["mr", "merge", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi mr merge --help` for glab flags"]),
    ]);
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown mr subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi mr list`, `glab-axi mr view <number>`, `glab-axi mr create`, or `glab-axi mr merge <number>`",
    ]);
  }

  const mergeRequests = await glabJson<MergeRequest[]>(
    ["mr", "list", "--output", "json"],
    ctx,
  );

  return renderOutput([
    `mrs:\n  ${encode(mergeRequests).replaceAll("\n", "\n  ")}`,
    renderHelp(["Use `glab-axi mr list --help` for glab flags"]),
  ]);
}
