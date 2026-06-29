import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Label = Record<string, unknown>;

export const LABEL_HELP = `usage: glab-axi label list [flags]
List project labels.

flags{list}:
  --output json

examples:
  glab-axi label list
`;

export async function labelCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return LABEL_HELP;
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown label subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi label list`",
    ]);
  }

  const labels = await glabJson<Label[]>(
    ["label", "list", "--output", "json"],
    ctx,
  );

  return renderOutput([
    `labels:\n  ${encode(labels).replaceAll("\n", "\n  ")}`,
    renderHelp(["Use `glab-axi label list --help` for glab flags"]),
  ]);
}
