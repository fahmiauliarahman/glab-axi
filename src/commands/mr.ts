import type { RepoContext } from "../context.js";
import { glabJson, glabExec } from "../glab.js";
import { AxiError } from "../errors.js";
import { getSuggestions } from "../suggestions.js";
import { hasFlag, getFlag, getPositional, requireNumber } from "../args.js";
import { takeBody, truncateBody } from "../body.js";
import { parseFields, type ExtraFieldSpec } from "../fields.js";
import { formatCountLine } from "../format.js";
import {
  field,
  pluck,
  relativeTime,
  lower,
  joinArray,
  custom,
  renderList,
  renderDetail,
  renderHelp,
  renderError,
  renderOutput,
  type FieldDef,
} from "../toon.js";

interface MrListItem {
  [key: string]: unknown;
  iid: number;
  title: string;
  state: string;
  author: { username: string };
  created_at: string;
}

export const MR_HELP = `usage: glab-axi mr <subcommand> [flags]
subcommands[14]:
  list, view <number>, create, update <number>, merge <number>, close <number>,
  reopen <number>, note <number>, approve <number>, diff <number>,
  checkout <number>, rebase <number>, revoke <number>, delete <number>
flags{list}:
  --state <opened|closed|merged|all>, --label <name>, --assignee <username>, --author <username>, --milestone <name>, --limit <n> (default 30), --fields <a,b,c>
flags{view}:
  --comments, --full (show complete body without truncation)
flags{create}:
  --title <text> (required), --body <text> or --body-file <path>, --assignee <username>, --reviewer <username>, --label <name>, --milestone <name>, --remove-source-branch, --draft, --wip
flags{update}:
  --title, --description <text>, --add-label <name>, --remove-label <name>, --assignee <username>, --milestone <name>, --remove-source-branch, --draft, --ready
flags{merge}:
  --merge-when-pipeline-succeeds, --remove-source-branch, --squash
flags{approve}:
  --password
flags{diff}:
  --color
flags{rebase}:
  (none)
flags{note}:
  -m, --message <text> (required)
examples:
  glab-axi mr list --state opened
  glab-axi mr view 42 --comments
  glab-axi mr create --title "Ship it" --body "Ready to merge"
  glab-axi mr update 42 --add-label bug
  glab-axi mr approve 42
  glab-axi mr diff 42
  glab-axi mr checkout 42
  glab-axi mr rebase 42
  glab-axi mr merge 42 --squash`;

const listSchema: FieldDef[] = [
  field("iid", "number"),
  field("title"),
  lower("state"),
  pluck("author", "username", "author"),
  relativeTime("created_at", "created"),
];

const viewSchema: FieldDef[] = [
  field("iid", "number"),
  field("title"),
  lower("state"),
  pluck("author", "username", "author"),
  relativeTime("created_at", "created"),
  field("source_branch", "source_branch"),
  field("target_branch", "target_branch"),
  custom("body", (item: Record<string, unknown>) => truncateBody(item.description, 500)),
];

const viewSchemaFull: FieldDef[] = viewSchema.map((f) =>
  "as" in f && f.as === "body"
    ? custom("body", (item: Record<string, unknown>) =>
        typeof item.description === "string" ? item.description : "",
      )
    : f,
);

const MR_LIST_EXTRA_FIELDS: Record<string, ExtraFieldSpec> = {
  labels: { jsonKey: "labels", def: joinArray("labels", "name", "labels") },
  milestone: { jsonKey: "milestone", def: pluck("milestone", "title", "milestone") },
  updated_at: { jsonKey: "updated_at", def: relativeTime("updated_at", "updated_at") },
  web_url: { jsonKey: "web_url", def: field("web_url", "url") },
  merged_at: { jsonKey: "merged_at", def: relativeTime("merged_at", "merged_at") },
};

async function listMrs(args: string[], ctx?: RepoContext): Promise<string> {
  const fieldsArg = getFlag(args, "--fields");
  const { extraDefs } = parseFields(fieldsArg, MR_LIST_EXTRA_FIELDS);
  const state = getFlag(args, "--state");
  const label = getFlag(args, "--label");
  const assignee = getFlag(args, "--assignee");
  const author = getFlag(args, "--author");
  const milestone = getFlag(args, "--milestone");
  const limitRaw = getFlag(args, "--limit");
  const limit = limitRaw ? parseInt(limitRaw, 10) : 30;

  const glabArgs = ["mr", "list", "--output", "json", "--per-page", String(limit)];
  if (state) glabArgs.push("--state", state);
  if (label) glabArgs.push("--label", label);
  if (assignee) glabArgs.push("--assignee", assignee);
  if (author) glabArgs.push("--author", author);
  if (milestone) glabArgs.push("--milestone", milestone);

  const items = await glabJson<MrListItem[]>(glabArgs, ctx);
  const isEmpty = items.length === 0;
  const countLine = formatCountLine({ count: items.length, limit });

  const extendedSchema = extraDefs.length > 0 ? [...listSchema, ...extraDefs] : listSchema;
  const help = getSuggestions({ domain: "mr", action: "list", isEmpty, repo: ctx });

  return renderOutput([
    countLine,
    renderList("mrs", items as unknown as Record<string, unknown>[], extendedSchema),
    renderHelp(help),
  ]);
}

async function viewMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  const withComments = hasFlag(args, "--comments");
  const full = hasFlag(args, "--full");

  const item = await glabJson<Record<string, unknown>>(
    ["mr", "view", String(num), "--output", "json"],
    ctx,
  );

  const schema = full ? viewSchemaFull : viewSchema;

  const blocks: string[] = [renderDetail("mr", item, schema)];

  if (withComments) {
    try {
      const notes = await glabJson<Array<{ author?: { username: string }; body?: string; created_at?: string }>>(
        ["mr", "note", "list", String(num), "--output", "json"],
        ctx,
      );
      if (Array.isArray(notes) && notes.length > 0) {
        blocks.push(renderList(
          "notes",
          notes as unknown as Record<string, unknown>[],
          [
            pluck("author", "username", "author"),
            relativeTime("created_at", "created"),
            custom("body", (c) => truncateBody(c.body, 800)),
          ],
        ));
      }
    } catch {
      // notes list may not be available
    }
  }

  const state = typeof item.state === "string" ? item.state.toLowerCase() : "";
  const help = getSuggestions({ domain: "mr", action: "view", state, id: num, repo: ctx });
  blocks.push(renderHelp(help));

  return renderOutput(blocks);
}

async function createMr(args: string[], ctx?: RepoContext): Promise<string> {
  const title = getFlag(args, "--title");
  if (!title) throw new AxiError("--title is required", "VALIDATION_ERROR");

  const body = takeBody(args);
  const assignee = getFlag(args, "--assignee");
  const reviewer = getFlag(args, "--reviewer");
  const label = getFlag(args, "--label");
  const milestone = getFlag(args, "--milestone");
  const removeSource = hasFlag(args, "--remove-source-branch");
  const draft = hasFlag(args, "--draft") || hasFlag(args, "--wip");

  const glabArgs = ["mr", "create", "--title", title];
  if (body !== undefined) glabArgs.push("--description", body);
  if (assignee) glabArgs.push("--assignee", assignee);
  if (reviewer) glabArgs.push("--reviewer", reviewer);
  if (label) glabArgs.push("--label", label);
  if (milestone) glabArgs.push("--milestone", milestone);
  if (removeSource) glabArgs.push("--remove-source-branch");
  if (draft) glabArgs.push("--draft");

  const output = await glabExec(glabArgs, ctx);

  const urlMatch = output.match(/\/-\/merge_requests\/(\d+)/);
  const num = urlMatch ? parseInt(urlMatch[1], 10) : 0;

  const item = await glabJson<Record<string, unknown>>(
    ["mr", "view", String(num), "--output", "json"],
    ctx,
  );

  const help = getSuggestions({ domain: "mr", action: "create", id: num, repo: ctx });
  return renderOutput([
    renderDetail("mr", item, [field("iid", "number"), field("title"), lower("state"), field("web_url", "url")]),
    renderHelp(help),
  ]);
}

async function updateMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");

  const title = getFlag(args, "--title");
  const description = getFlag(args, "--description");
  const addLabel = getFlag(args, "--add-label") ?? getFlag(args, "--label");
  const removeLabel = getFlag(args, "--remove-label") ?? getFlag(args, "--unlabel");
  const assignee = getFlag(args, "--assignee");
  const milestone = getFlag(args, "--milestone");
  const removeSource = hasFlag(args, "--remove-source-branch");
  const draft = hasFlag(args, "--draft");
  const ready = hasFlag(args, "--ready");

  const glabArgs = ["mr", "update", String(num)];
  if (title) glabArgs.push("--title", title);
  if (description) glabArgs.push("--description", description);
  if (addLabel) glabArgs.push("--label", addLabel);
  if (removeLabel) glabArgs.push("--unlabel", removeLabel);
  if (assignee) glabArgs.push("--assignee", assignee);
  if (milestone) glabArgs.push("--milestone", milestone);
  if (removeSource) glabArgs.push("--remove-source-branch");
  if (draft) glabArgs.push("--draft");
  if (ready) glabArgs.push("--ready");

  if (glabArgs.length > 3) {
    await glabExec(glabArgs, ctx);
  }

  const item = await glabJson<Record<string, unknown>>(
    ["mr", "view", String(num), "--output", "json"],
    ctx,
  );

  const help = getSuggestions({ domain: "mr", action: "update", id: num, repo: ctx });
  return renderOutput([
    renderDetail("mr", item, [field("iid", "number"), field("title"), lower("state")]),
    renderHelp(help),
  ]);
}

async function mergeMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");

  const current = await glabJson<{ state: string }>(
    ["mr", "view", String(num), "--output", "json"],
    ctx,
  );
  if (current.state.toLowerCase() === "merged") {
    const help = getSuggestions({ domain: "mr", action: "merge", id: num, repo: ctx });
    return renderOutput([
      renderDetail("mr", { iid: num, state: "merged", already: true }, [field("iid", "number"), field("state"), field("already")]),
      renderHelp(help),
    ]);
  }

  const glabArgs = ["mr", "merge", String(num)];
  if (hasFlag(args, "--merge-when-pipeline-succeeds")) glabArgs.push("--merge-when-pipeline-succeeds");
  if (hasFlag(args, "--remove-source-branch")) glabArgs.push("--remove-source-branch");
  if (hasFlag(args, "--squash")) glabArgs.push("--squash");

  await glabExec(glabArgs, ctx);

  const help = getSuggestions({ domain: "mr", action: "merge", id: num, repo: ctx });
  return renderOutput([
    renderDetail("merged", { number: num, status: "ok" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

async function closeMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");

  const current = await glabJson<{ state: string }>(
    ["mr", "view", String(num), "--output", "json"],
    ctx,
  );
  if (current.state.toLowerCase() === "closed") {
    return renderOutput([
      renderDetail("mr", { iid: num, state: "closed", already: true }, [field("iid", "number"), field("state"), field("already")]),
    ]);
  }

  await glabExec(["mr", "close", String(num)], ctx);

  const item = await glabJson<Record<string, unknown>>(
    ["mr", "view", String(num), "--output", "json"],
    ctx,
  );

  return renderOutput([
    renderDetail("mr", item, [field("iid", "number"), lower("state")]),
  ]);
}

async function reopenMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  await glabExec(["mr", "reopen", String(num)], ctx);

  const item = await glabJson<Record<string, unknown>>(
    ["mr", "view", String(num), "--output", "json"],
    ctx,
  );

  return renderOutput([
    renderDetail("mr", item, [field("iid", "number"), lower("state")]),
  ]);
}

async function noteMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  const message = getFlag(args, "--message") ?? getFlag(args, "-m");
  if (!message) {
    throw new AxiError("-m/--message is required for MR note", "VALIDATION_ERROR");
  }

  await glabExec(["mr", "note", String(num), "--message", message], ctx);

  return renderOutput([
    renderDetail("noted", { number: num, status: "ok" }, [field("number"), field("status")]),
  ]);
}

async function approveMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  await glabExec(["mr", "approve", String(num), ...args.slice(1).filter((a) => a.startsWith("--"))], ctx);

  const help = getSuggestions({ domain: "mr", action: "approve", id: num, repo: ctx });
  return renderOutput([
    renderDetail("approved", { number: num, status: "ok" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

async function diffMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  const diff = await glabExec(["mr", "diff", String(num), ...args.slice(1).filter((a) => a.startsWith("--"))], ctx);

  return renderOutput([
    renderDetail("mr_diff", { number: num, diff }, [field("number"), field("diff")]),
    renderHelp(getSuggestions({ domain: "mr", action: "diff", id: num, repo: ctx })),
  ]);
}

async function checkoutMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  await glabExec(["mr", "checkout", String(num), ...args.slice(1).filter((a) => a.startsWith("--"))], ctx);

  const help = getSuggestions({ domain: "mr", action: "checkout", id: num, repo: ctx });
  return renderOutput([
    renderDetail("checkout", { number: num, status: "ok" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

async function rebaseMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  await glabExec(["mr", "rebase", String(num), ...args.slice(1).filter((a) => a.startsWith("--"))], ctx);

  const help = getSuggestions({ domain: "mr", action: "rebase", id: num, repo: ctx });
  return renderOutput([
    renderDetail("rebased", { number: num, status: "ok" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

async function revokeMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  await glabExec(["mr", "revoke", String(num)], ctx);

  const help = getSuggestions({ domain: "mr", action: "revoke", id: num, repo: ctx });
  return renderOutput([
    renderDetail("revoked", { number: num, status: "ok" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

async function deleteMr(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "MR");
  await glabExec(["mr", "delete", String(num), "--yes"], ctx);

  const help = getSuggestions({ domain: "mr", action: "delete", id: num, repo: ctx });
  return renderOutput([
    renderDetail("deleted", { number: num, status: "ok" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

export async function mrCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const sub = args[0];

  if (!sub || hasFlag(args, "--help")) {
    return renderOutput([MR_HELP]);
  }

  switch (sub) {
    case "list":
      return listMrs(args, ctx);
    case "view":
      return viewMr(args, ctx);
    case "create":
      return createMr(args, ctx);
    case "update":
      return updateMr(args, ctx);
    case "merge":
      return mergeMr(args, ctx);
    case "close":
      return closeMr(args, ctx);
    case "reopen":
      return reopenMr(args, ctx);
    case "note":
    case "comment":
      return noteMr(args, ctx);
    case "approve":
      return approveMr(args, ctx);
    case "diff":
      return diffMr(args, ctx);
    case "checkout":
      return checkoutMr(args, ctx);
    case "rebase":
      return rebaseMr(args, ctx);
    case "revoke":
      return revokeMr(args, ctx);
    case "delete":
      return deleteMr(args, ctx);
    default:
      return renderError(`Unknown mr subcommand: ${sub}`, "VALIDATION_ERROR", [
        "Available subcommands: list, view, create, update, merge, close, reopen, note, approve, diff, checkout, rebase, revoke, delete",
      ]);
  }
}
