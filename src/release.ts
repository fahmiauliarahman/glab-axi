import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Release = Record<string, unknown>;

export const RELEASE_HELP = `usage: glab-axi release list [flags]
List releases.

flags{list}:
  --output json

examples:
  glab-axi release list
`;

export async function releaseCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return RELEASE_HELP;
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown release subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi release list`",
    ]);
  }

  const releases = await glabJson<Release[]>(
    ["release", "list", "--output", "json"],
    ctx,
  );

  return renderOutput([
    `releases:\n  ${encode(releases).replaceAll("\n", "\n  ")}`,
    renderHelp(["Use `glab-axi release list --help` for glab flags"]),
  ]);
}
