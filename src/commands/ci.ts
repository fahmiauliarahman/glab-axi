import { encode } from "@toon-format/toon";
import type { RepoContext } from "../context.js";
import { glabJson, glabExec } from "../glab.js";
import { getSuggestions } from "../suggestions.js";
import { hasFlag, getFlag } from "../args.js";
import {
  field,
  lower,
  relativeTime,
  renderList,
  renderDetail,
  renderHelp,
  renderError,
  renderOutput,
  type FieldDef,
} from "../toon.js";
import { formatCountLine } from "../format.js";

export const CI_HELP = `usage: glab-axi ci <subcommand> [flags]
subcommands[7]:
  list, get, status, run, create, run-trig, trace <job-id|name>
flags{list}:
  --limit <n> (default 20), --status <state>
flags{get}:
  --pipeline-id <id>, --merge-request, --status <state>
flags{status}:
  --branch <name>, --live, --compact
flags{run}:
  --branch <name>, --variables <key=value>
flags{trace}:
  --branch <name>, --pipeline-id <id>
examples:
  glab-axi ci list
  glab-axi ci get
  glab-axi ci status
  glab-axi ci run
  glab-axi ci trace 224356863`;

const listSchema: FieldDef[] = [
  field("id"),
  field("status"),
  field("ref", "branch"),
  field("source"),
  relativeTime("created_at", "created"),
];

const jobSchema: FieldDef[] = [
  field("id"),
  field("name"),
  field("stage"),
  lower("status"),
];

async function listPipelines(args: string[], ctx?: RepoContext): Promise<string> {
  const limit = getFlag(args, "--limit") ?? "20";
  const status = getFlag(args, "--status");

  const glabArgs = ["ci", "list", "--output", "json", "--per-page", limit];
  if (status) glabArgs.push("--status", status);

  const items = await glabJson<Record<string, unknown>[]>(glabArgs, ctx);
  const isEmpty = items.length === 0;
  const limitNum = Number(limit);
  const countLine = formatCountLine({ count: items.length, limit: limitNum });
  const help = getSuggestions({ domain: "ci", action: "list", isEmpty, repo: ctx });

  return renderOutput([
    countLine,
    renderList("pipelines", items, listSchema),
    renderHelp(help),
  ]);
}

async function getPipeline(args: string[], ctx?: RepoContext): Promise<string> {
  const glabArgs = ["ci", "get", "--output", "json", ...args.slice(1)];
  const item = await glabJson<Record<string, unknown>>(glabArgs, ctx);

  const help = getSuggestions({ domain: "ci", action: "get", repo: ctx });
  return renderOutput([
    renderDetail("pipeline", item, [field("id"), field("status"), field("ref", "branch"), field("source"), relativeTime("created_at", "created")]),
    renderHelp(help),
  ]);
}

async function statusPipeline(args: string[], ctx?: RepoContext): Promise<string> {
  const glabArgs = ["ci", "status", "--output", "json", ...args.slice(1)];
  const item = await glabJson<Record<string, unknown>>(glabArgs, ctx);

  const help = getSuggestions({ domain: "ci", action: "status", repo: ctx });
  const blocks: string[] = [
    renderDetail("pipeline", item, [field("id"), field("status"), field("ref", "branch"), relativeTime("created_at", "created")]),
  ];

  // Show jobs if available
  if (Array.isArray(item.jobs) && (item.jobs as unknown[]).length > 0) {
    blocks.push(renderList("jobs", item.jobs as Record<string, unknown>[], jobSchema));
  }

  blocks.push(renderHelp(help));
  return renderOutput(blocks);
}

async function runPipeline(args: string[], ctx?: RepoContext): Promise<string> {
  await glabExec(["ci", "run", ...args.slice(1)], ctx);

  const help = getSuggestions({ domain: "ci", action: "run", repo: ctx });
  return renderOutput([
    encode({ pipeline_run: "ok" }),
    renderHelp(help),
  ]);
}

async function traceJob(args: string[], ctx?: RepoContext): Promise<string> {
  return glabExec(["ci", "trace", ...args.slice(1)], ctx);
}

export async function ciCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const sub = args[0];

  if (sub === undefined || sub === "--help" || hasFlag(args, "--help")) {
    return CI_HELP;
  }

  switch (sub) {
    case "list":
      return listPipelines(args, ctx);
    case "get":
      return getPipeline(args, ctx);
    case "status":
      return statusPipeline(args, ctx);
    case "run":
    case "create":
      return runPipeline(args, ctx);
    case "run-trig":
      await glabExec(["ci", "run-trig", ...args.slice(1)], ctx);
      return renderOutput([encode({ pipeline_trigger: "ok" })]);
    case "trace":
      return traceJob(args, ctx);
    default:
      return renderError(`Unknown ci subcommand: ${sub}`, "VALIDATION_ERROR", [
        "Available subcommands: list, get, status, run, run-trig, trace",
      ]);
  }
}
