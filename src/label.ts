import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabExec, glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Label = Record<string, unknown>;

export const LABEL_HELP = `usage: glab-axi label list [flags]
List project labels.

usage: glab-axi label create [flags]
Create a project label.

flags{list}:
  --output json

flags{create}:
  --name <name>, --color <hex>, --description <text>, --priority <value>

examples:
  glab-axi label list
  glab-axi label create --name bug --color "#FF0000"
`;

export const LABEL_CREATE_HELP = `usage: glab-axi label create [flags]
Create a project label.

flags{create}:
  --name <name>, --color <hex>, --description <text>, --priority <value>

examples:
  glab-axi label create --name bug --color "#FF0000"
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
    if (subcommand === "create") {
      if (args.includes("--help") || args.includes("-h")) {
        return LABEL_CREATE_HELP;
      }

      const output = await glabExec(["label", "create", ...args.slice(1)], ctx);

      return renderOutput([
        output.trim(),
        renderHelp(["Use `glab-axi label create --help` for glab flags"]),
      ]);
    }

    throw new AxiError("Unknown label subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi label list` or `glab-axi label create`",
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
