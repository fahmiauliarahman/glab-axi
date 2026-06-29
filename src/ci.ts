import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Pipeline = Record<string, unknown>;

export const CI_HELP = `usage: glab-axi ci list [flags]
List CI/CD pipelines.

usage: glab-axi ci status [flags]
Show pipeline status for current branch.

flags{list}:
  --output json

flags{status}:
  --branch <name>, --live, --compact, --output json

examples:
  glab-axi ci list
  glab-axi ci status
`;

export async function ciCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (
    subcommand === undefined ||
    subcommand === "--help" ||
    args.includes("--help")
  ) {
    return CI_HELP;
  }

  if (subcommand !== "list") {
    if (subcommand === "status") {
      const status = await glabJson<Record<string, unknown>>(
        ["ci", "status", "--output", "json", ...args.slice(1)],
        ctx,
      );

      return renderOutput([
        `pipeline:\n  ${encode(status).replaceAll("\n", "\n  ")}`,
        renderHelp(["Use `glab-axi ci status --help` for glab flags"]),
      ]);
    }

    throw new AxiError("Unknown ci subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi ci list`",
      "Run `glab-axi ci status`",
    ]);
  }

  const pipelines = await glabJson<Pipeline[]>(
    ["ci", "list", "--output", "json"],
    ctx,
  );

  return renderOutput([
    `pipelines:\n  ${encode(pipelines).replaceAll("\n", "\n  ")}`,
    renderHelp(["Use `glab-axi ci list --help` for glab flags"]),
  ]);
}
