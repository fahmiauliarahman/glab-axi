import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type MergeRequest = Record<string, unknown>;

export const MR_HELP = `usage: glab-axi mr <subcommand> [flags]
subcommands[2]:
  list, view <number>
flags{list}:
  --output json
flags{view}:
  --comments, --output json
examples:
  glab-axi mr list
  glab-axi mr view 42
`;

export const MR_VIEW_HELP = `usage: glab-axi mr view <number> [flags]
Show merge request details.

flags{view}:
  --comments, --output json

examples:
  glab-axi mr view 42
  glab-axi mr view 42 --comments
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

  if (subcommand !== "list") {
    throw new AxiError("Unknown mr subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi mr list` or `glab-axi mr view <number>`",
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
