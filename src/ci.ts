import { encode } from "@toon-format/toon";
import { AxiError } from "axi-sdk-js";
import type { RepoContext } from "./context.js";
import { glabExec, glabJson } from "./glab.js";
import { renderHelp, renderOutput } from "./toon.js";

type Pipeline = Record<string, unknown>;

export const CI_HELP = `usage: glab-axi ci list [flags]
List CI/CD pipelines.

usage: glab-axi ci get [flags]
Show pipeline details for current branch.

usage: glab-axi ci status [flags]
Show pipeline status for current branch.

usage: glab-axi ci run [flags]
Run a new pipeline for current branch.

usage: glab-axi ci create [flags]
Alias for ci run.

usage: glab-axi ci run-trig [flags]
Trigger a pipeline with a token.

usage: glab-axi ci trace <job-id|name> [flags]
Stream a CI/CD job trace.

flags{list}:
  --output json

flags{get}:
  --pipeline-id <id>, --merge-request, --status <state>, --output json

flags{status}:
  --branch <name>, --live, --compact, --output json

flags{run}:
  --web

flags{run-trig}:
  --token, --branch, --input, --variables

flags{trace}:
  --branch <name>, --pipeline-id <id>

examples:
  glab-axi ci list
  glab-axi ci get
  glab-axi ci status
  glab-axi ci run
  glab-axi ci create
  glab-axi ci run-trig -t xxxx
  glab-axi ci trace 224356863
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
    if (subcommand === "get") {
      const pipeline = await glabJson<Record<string, unknown>>(
        ["ci", "get", "--output", "json", ...args.slice(1)],
        ctx,
      );

      return renderOutput([
        `pipeline:\n  ${encode(pipeline).replaceAll("\n", "\n  ")}`,
        renderHelp(["Use `glab-axi ci get --help` for glab flags"]),
      ]);
    }

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

    if (subcommand === "run") {
      await glabExec(["ci", "run", ...args.slice(1)], ctx);

      return renderOutput([
        encode({ pipeline_run: "ok" }),
        renderHelp(["Use `glab-axi ci run --help` for glab flags"]),
      ]);
    }

    if (subcommand === "create") {
      return ciCommand(["run", ...args.slice(1)], ctx);
    }

    if (subcommand === "run-trig") {
      await glabExec(["ci", "run-trig", ...args.slice(1)], ctx);

      return renderOutput([
        encode({ pipeline_trigger: "ok" }),
        renderHelp(["Use `glab-axi ci run-trig --help` for glab flags"]),
      ]);
    }

    if (subcommand === "trace") {
      return glabExec(["ci", "trace", ...args.slice(1)], ctx);
    }

    throw new AxiError("Unknown ci subcommand", "VALIDATION_ERROR", [
      "Run `glab-axi ci list`",
      "Run `glab-axi ci get`",
      "Run `glab-axi ci status`",
      "Run `glab-axi ci run`",
      "Run `glab-axi ci create`",
      "Run `glab-axi ci run-trig`",
      "Run `glab-axi ci trace`",
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
