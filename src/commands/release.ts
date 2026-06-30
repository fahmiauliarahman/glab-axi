import type { RepoContext } from "../context.js";
import { glabJson, glabExec } from "../glab.js";
import { AxiError } from "../errors.js";
import { getSuggestions } from "../suggestions.js";
import { getFlag } from "../args.js";
import { takeBody } from "../body.js";
import {
  field,
  relativeTime,
  renderList,
  renderDetail,
  renderHelp,
  renderError,
  renderOutput,
  type FieldDef,
} from "../toon.js";
import { formatCountLine } from "../format.js";

export const RELEASE_HELP = `usage: glab-axi release <subcommand> [flags]
subcommands[6]:
  list, view <tag>, create <tag>, delete <tag>, download <tag>, upload <tag>
flags{list}:
  --limit <n> (default 30)
flags{create}:
  --notes <text>, --notes-file <file>, --ref <ref>, --assets-links <json>
flags{download}:
  --dir <path>, --archive <format>
flags{upload}:
  --name <name>, --url <url>, --link-type <type>
examples:
  glab-axi release list
  glab-axi release view v1.0.1
  glab-axi release create v1.0.1 --notes "Bugfix release"
  glab-axi release download v1.0.1 --dir ./assets
  glab-axi release upload v1.0.1 binary.tar.gz`;

const listSchema: FieldDef[] = [
  field("tag_name", "tag"),
  field("name"),
  relativeTime("created_at", "created"),
];

const viewSchema: FieldDef[] = [
  field("tag_name", "tag"),
  field("name"),
  field("description", "notes"),
  relativeTime("created_at", "created"),
  relativeTime("released_at", "released"),
];

async function listReleases(args: string[], ctx?: RepoContext): Promise<string> {
  const limit = getFlag(args, "--limit") ?? "30";

  const releases = await glabJson<Record<string, unknown>[]>(
    ["release", "list", "--output", "json", "--per-page", limit],
    ctx,
  );
  const isEmpty = releases.length === 0;
  const limitNum = Number(limit);
  const countLine = formatCountLine({ count: releases.length, limit: limitNum });
  const help = getSuggestions({ domain: "release", action: "list", isEmpty, repo: ctx });

  return renderOutput([
    countLine,
    renderList("releases", releases, listSchema),
    renderHelp(help),
  ]);
}

async function viewRelease(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return RELEASE_HELP;
  const tag = args[1];
  if (!tag) throw new AxiError("Release tag is required: glab-axi release view <tag>", "VALIDATION_ERROR");

  const item = await glabJson<Record<string, unknown>>(
    ["release", "view", tag, "--output", "json"],
    ctx,
  );

  const help = getSuggestions({ domain: "release", action: "view", id: tag, repo: ctx });
  return renderOutput([
    renderDetail("release", item, viewSchema),
    renderHelp(help),
  ]);
}

async function createRelease(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return RELEASE_HELP;
  const positionals = args.filter((a) => !a.startsWith("--"));
  const tag = positionals[1];
  if (!tag) throw new AxiError("Release tag is required: glab-axi release create <tag>", "VALIDATION_ERROR");

  const body = takeBody(args, {
    inlineFlags: ["--notes"],
    fileFlags: ["--notes-file"],
  });
  const ref = getFlag(args, "--ref");
  const assetsLinks = getFlag(args, "--assets-links");

  const glabArgs = ["release", "create", tag];
  if (body !== undefined) glabArgs.push("--notes", body);
  if (ref) glabArgs.push("--ref", ref);
  if (assetsLinks) glabArgs.push("--assets-links", assetsLinks);

  await glabExec(glabArgs, ctx);

  const help = getSuggestions({ domain: "release", action: "create", id: tag, repo: ctx });
  return renderOutput([
    renderDetail("release", { tag, status: "created" }, [field("tag"), field("status")]),
    renderHelp(help),
  ]);
}

async function deleteRelease(args: string[], ctx?: RepoContext): Promise<string> {
  const positionals = args.filter((a) => !a.startsWith("--"));
  const tag = positionals[1];
  if (!tag) throw new AxiError("Release tag is required: glab-axi release delete <tag>", "VALIDATION_ERROR");

  await glabExec(["release", "delete", tag, "--yes"], ctx);

  return renderOutput([
    renderDetail("release", { tag, status: "deleted" }, [field("tag"), field("status")]),
  ]);
}

async function downloadRelease(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return RELEASE_HELP;
  const positionals = args.filter((a) => !a.startsWith("--"));
  const tag = positionals[1];
  if (!tag) throw new AxiError("Release tag is required: glab-axi release download <tag>", "VALIDATION_ERROR");

  const glabArgs = ["release", "download", tag, ...args.slice(1).filter((a) => a.startsWith("--"))];
  await glabExec(glabArgs, ctx);

  const help = getSuggestions({ domain: "release", action: "download", id: tag, repo: ctx });
  return renderOutput([
    renderDetail("downloaded", { tag, status: "ok" }, [field("tag"), field("status")]),
    renderHelp(help),
  ]);
}

async function uploadRelease(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return RELEASE_HELP;
  const positionals = args.filter((a) => !a.startsWith("--"));
  const tag = positionals[1];
  if (!tag) throw new AxiError("Release tag is required: glab-axi release upload <tag>", "VALIDATION_ERROR");

  const glabArgs = ["release", "upload", tag, ...args.slice(2)];
  await glabExec(glabArgs, ctx);

  const help = getSuggestions({ domain: "release", action: "upload", id: tag, repo: ctx });
  return renderOutput([
    renderDetail("uploaded", { tag, status: "ok" }, [field("tag"), field("status")]),
    renderHelp(help),
  ]);
}

export async function releaseCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const sub = args[0];

  if (sub === "--help" || sub === undefined) return RELEASE_HELP;

  switch (sub) {
    case "list":
      return listReleases(args, ctx);
    case "view":
      return viewRelease(args, ctx);
    case "create":
      return createRelease(args, ctx);
    case "delete":
      return deleteRelease(args, ctx);
    case "download":
      return downloadRelease(args, ctx);
    case "upload":
      return uploadRelease(args, ctx);
    default:
      return renderError(`Unknown subcommand: ${sub}`, "VALIDATION_ERROR", [
        "Available subcommands: list, view, create, delete, download, upload",
      ]);
  }
}
