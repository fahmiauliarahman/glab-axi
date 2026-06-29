import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabExec, glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Release = Record<string, unknown>;

export const RELEASE_HELP = `usage: glab-axi release list [flags]
List releases.

flags{list}:
  --output json

examples:
  glab-axi release list
`;

export const RELEASE_VIEW_HELP = `usage: glab-axi release view [<tag>] [flags]
Show release details.

examples:
  glab-axi release view
  glab-axi release view v1.0.1
`;

export async function releaseCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const subcommand = args[0];

  if (subcommand === undefined || subcommand === "--help") {
    return RELEASE_HELP;
  }

  if (subcommand === "view") {
    if (args.includes("--help") || args.includes("-h")) {
      return RELEASE_VIEW_HELP;
    }

    const output = await glabExec(["release", "view", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi release view --help` for glab flags"]),
    ]);
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown release subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi release list` or `glab-axi release view [<tag>]`",
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
