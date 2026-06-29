import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Pipeline = Record<string, unknown>;

export const CI_HELP = `usage: glab-axi ci list [flags]
List CI/CD pipelines.

flags{list}:
  --output json

examples:
  glab-axi ci list
`;

export async function ciCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return CI_HELP;
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown ci subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi ci list`",
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
