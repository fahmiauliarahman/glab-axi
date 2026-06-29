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

export async function issueCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return ISSUE_HELP;
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown issue subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi issue list`",
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
