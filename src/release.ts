import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabExec, glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Release = Record<string, unknown>;

export const RELEASE_HELP = `usage: glab-axi release <subcommand> [flags]
subcommands[3]:
  list, view <tag>, create <tag>

flags{list}:
  --output json

examples:
  glab-axi release list
  glab-axi release view v1.0.1
  glab-axi release create v1.0.1
`;

export const RELEASE_CREATE_HELP = `usage: glab-axi release create <tag> [flags]
Create a release.

flags{create}:
  -N, --notes <text>, -F, --notes-file <file>

examples:
  glab-axi release create v1.0.1 --notes "bugfix release"
  glab-axi release create v1.0.1 -F changelog.md
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

  if (subcommand === "create") {
    if (args.includes("--help") || args.includes("-h")) {
      return RELEASE_CREATE_HELP;
    }

    const output = await glabExec(["release", "create", ...args.slice(1)], ctx);

    return renderOutput([
      output.trim(),
      renderHelp(["Use `glab-axi release create --help` for glab flags"]),
    ]);
  }

  if (subcommand !== "list") {
    throw new AxiError("Unknown release subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi release list`, `glab-axi release view [<tag>]`, or `glab-axi release create <tag>`",
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
