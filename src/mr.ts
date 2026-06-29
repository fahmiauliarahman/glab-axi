import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type MergeRequest = Record<string, unknown>;

export const MR_HELP = `usage: glab-axi mr list [flags]
List project merge requests.

flags{list}:
  --output json

examples:
  glab-axi mr list
`;

export async function mrCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return MR_HELP;
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown mr subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi mr list`",
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
