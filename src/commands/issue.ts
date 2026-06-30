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
  joinArray,
  relativeTime,
  lower,
  custom,
  renderList,
  renderDetail,
  renderHelp,
  renderError,
  renderOutput,
  type FieldDef,
} from "../toon.js";

interface IssueListItem {
  [key: string]: unknown;
  iid: number;
  title: string;
  state: string;
  author: { username: string };
  created_at: string;
}

interface IssueComment {
  [key: string]: unknown;
  author?: { username: string };
  body?: string;
  created_at?: string;
}

export const ISSUE_HELP = `usage: glab-axi issue <subcommand> [flags]
subcommands[12]:
  list, view <number>, create, note <number>, comment <number>, update <number>, close <number>, delete <number>, reopen <number>, open <number>, subscribe <number>, unsubscribe <number>
flags{list}:
  --state <opened|closed|all>, --label <name>, --assignee <username>, --author <username>, --milestone <name>, --limit <n> (default 30), --fields <a,b,c>
flags{view}:
  --comments, --full (show complete body without truncation)
flags{create}:
  --title <text> (required), --body <text> or --body-file <path>, --assignee <username>, --label <name>, --milestone <name>, --confidential
flags{update}:
  --title, --body <text> or --body-file <path>, --add-label, --remove-label, --assignee, --milestone, --confidential, --public
flags{close}:
  (none)
flags{note}:
  -m, --message <text> (required)
flags{comment}:
  alias for note
examples:
  glab-axi issue list --state closed --label bug
  glab-axi issue view 42 --comments
  glab-axi issue create --title "Fix login" --body "Steps..."
  glab-axi issue note 42 -m "closing because !123 was merged"
  glab-axi issue close 42
  glab-axi issue reopen 42`;

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
  custom("body", (item: Record<string, unknown>) => truncateBody(item.description, 500)),
];

const viewSchemaFull: FieldDef[] = viewSchema.map((f) =>
  "as" in f && f.as === "body"
    ? custom("body", (item: Record<string, unknown>) =>
        typeof item.description === "string" ? item.description : "",
      )
    : f,
);

const ISSUE_LIST_EXTRA_FIELDS: Record<string, ExtraFieldSpec> = {
  labels: { jsonKey: "labels", def: joinArray("labels", "name", "labels") },
  milestone: { jsonKey: "milestone", def: pluck("milestone", "title", "milestone") },
  updated_at: { jsonKey: "updated_at", def: relativeTime("updated_at", "updated_at") },
  web_url: { jsonKey: "web_url", def: field("web_url", "url") },
};

async function listIssues(args: string[], ctx?: RepoContext): Promise<string> {
  const fieldsArg = getFlag(args, "--fields");
  const { extraDefs } = parseFields(fieldsArg, ISSUE_LIST_EXTRA_FIELDS);
  const state = getFlag(args, "--state");
  const label = getFlag(args, "--label");
  const assignee = getFlag(args, "--assignee");
  const author = getFlag(args, "--author");
  const milestone = getFlag(args, "--milestone");
  const limitRaw = getFlag(args, "--limit");
  const limit = limitRaw ? parseInt(limitRaw, 10) : 30;

  const glabArgs = ["issue", "list", "--output", "json", "--per-page", String(limit)];
  if (state) glabArgs.push("--state", state);
  if (label) glabArgs.push("--label", label);
  if (assignee) glabArgs.push("--assignee", assignee);
  if (author) glabArgs.push("--author", author);
  if (milestone) glabArgs.push("--milestone", milestone);

  const items = await glabJson<IssueListItem[]>(glabArgs, ctx);
  const isEmpty = items.length === 0;
  const countLine = formatCountLine({ count: items.length, limit });

  const extendedSchema = extraDefs.length > 0 ? [...listSchema, ...extraDefs] : listSchema;
  const help = getSuggestions({ domain: "issue", action: "list", isEmpty, repo: ctx });

  return renderOutput([
    countLine,
    renderList("issues", items as unknown as Record<string, unknown>[], extendedSchema),
    renderHelp(help),
  ]);
}

async function viewIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "issue");
  const withComments = hasFlag(args, "--comments");
  const full = hasFlag(args, "--full");

  const item = await glabJson<Record<string, unknown>>(
    ["issue", "view", String(num), "--output", "json"],
    ctx,
  );

  const schema = full ? viewSchemaFull : viewSchema;

  const blocks: string[] = [renderDetail("issue", item, schema)];

  if (withComments) {
    try {
      const notes = await glabJson<IssueComment[]>(
        ["issue", "note", "list", String(num), "--output", "json"],
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
  const help = getSuggestions({ domain: "issue", action: "view", state, id: num, repo: ctx });
  blocks.push(renderHelp(help));

  return renderOutput(blocks);
}

async function createIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const title = getFlag(args, "--title");
  if (!title) throw new AxiError("--title is required", "VALIDATION_ERROR");

  const body = takeBody(args);
  const assignee = getFlag(args, "--assignee");
  const label = getFlag(args, "--label");
  const milestone = getFlag(args, "--milestone");
  const confidential = hasFlag(args, "--confidential");

  const glabArgs = ["issue", "create", "--title", title];
  if (body !== undefined) glabArgs.push("--description", body);
  if (assignee) glabArgs.push("--assignee", assignee);
  if (label) glabArgs.push("--label", label);
  if (milestone) glabArgs.push("--milestone", milestone);
  if (confidential) glabArgs.push("--confidential");

  const output = await glabExec(glabArgs, ctx);

  // Parse IID from output: e.g. "https://gitlab.com/group/project/-/issues/42"
  const urlMatch = output.match(/\/-\/issues\/(\d+)/);
  const num = urlMatch ? parseInt(urlMatch[1], 10) : 0;

  const item = await glabJson<Record<string, unknown>>(
    ["issue", "view", String(num), "--output", "json"],
    ctx,
  );

  const help = getSuggestions({ domain: "issue", action: "create", id: num, repo: ctx });
  return renderOutput([
    renderDetail("issue", item, [field("iid", "number"), field("title"), lower("state"), field("web_url", "url")]),
    renderHelp(help),
  ]);
}

async function noteIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "issue");
  const message = getFlag(args, "--message") ?? getFlag(args, "-m");
  if (!message) {
    throw new AxiError("-m/--message is required for issue note", "VALIDATION_ERROR");
  }

  await glabExec(["issue", "note", String(num), "--message", message], ctx);

  const help = getSuggestions({ domain: "issue", action: "note", id: num, repo: ctx });
  return renderOutput([
    renderDetail("noted", { number: num, status: "ok" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

async function updateIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "issue");
  const title = getFlag(args, "--title");
  const body = takeBody(args);
  const addLabel = getFlag(args, "--add-label") ?? getFlag(args, "--label");
  const removeLabel = getFlag(args, "--remove-label") ?? getFlag(args, "--unlabel");
  const assignee = getFlag(args, "--assignee");
  const milestone = getFlag(args, "--milestone");
  const confidential = hasFlag(args, "--confidential");
  const publicFlag = hasFlag(args, "--public");

  const glabArgs = ["issue", "update", String(num)];
  if (title) glabArgs.push("--title", title);
  if (body !== undefined) glabArgs.push("--description", body);
  if (addLabel) glabArgs.push("--label", addLabel);
  if (removeLabel) glabArgs.push("--unlabel", removeLabel);
  if (assignee) glabArgs.push("--assignee", assignee);
  if (milestone) glabArgs.push("--milestone", milestone);
  if (confidential) glabArgs.push("--confidential");
  if (publicFlag) glabArgs.push("--public");

  if (glabArgs.length > 3) {
    await glabExec(glabArgs, ctx);
  }

  const item = await glabJson<Record<string, unknown>>(
    ["issue", "view", String(num), "--output", "json"],
    ctx,
  );

  const help = getSuggestions({ domain: "issue", action: "update", id: num, repo: ctx });
  return renderOutput([
    renderDetail("issue", item, [field("iid", "number"), field("title"), lower("state"), joinArray("labels", "name", "labels")]),
    renderHelp(help),
  ]);
}

async function closeIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "issue");

  const current = await glabJson<{ state: string }>(
    ["issue", "view", String(num), "--output", "json"],
    ctx,
  );
  if (current.state.toLowerCase() === "closed") {
    const help = getSuggestions({ domain: "issue", action: "close", id: num, repo: ctx });
    return renderOutput([
      renderDetail("issue", { iid: num, state: "closed", already: true }, [field("iid", "number"), field("state"), field("already")]),
      renderHelp(help),
    ]);
  }

  await glabExec(["issue", "close", String(num)], ctx);

  const item = await glabJson<Record<string, unknown>>(
    ["issue", "view", String(num), "--output", "json"],
    ctx,
  );

  const help = getSuggestions({ domain: "issue", action: "close", id: num, repo: ctx });
  return renderOutput([
    renderDetail("issue", item, [field("iid", "number"), lower("state")]),
    renderHelp(help),
  ]);
}

async function reopenIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "issue");

  const current = await glabJson<{ state: string }>(
    ["issue", "view", String(num), "--output", "json"],
    ctx,
  );
  if (current.state.toLowerCase() === "opened") {
    const help = getSuggestions({ domain: "issue", action: "reopen", id: num, repo: ctx });
    return renderOutput([
      renderDetail("issue", { iid: num, state: "opened", already: true }, [field("iid", "number"), field("state"), field("already")]),
      renderHelp(help),
    ]);
  }

  await glabExec(["issue", "reopen", String(num)], ctx);

  const item = await glabJson<Record<string, unknown>>(
    ["issue", "view", String(num), "--output", "json"],
    ctx,
  );

  const help = getSuggestions({ domain: "issue", action: "reopen", id: num, repo: ctx });
  return renderOutput([
    renderDetail("issue", item, [field("iid", "number"), lower("state")]),
    renderHelp(help),
  ]);
}

async function deleteIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "issue");

  await glabExec(["issue", "delete", String(num), "--yes"], ctx);

  const help = getSuggestions({ domain: "issue", action: "delete", id: num, repo: ctx });
  return renderOutput([
    renderDetail("issue", { number: num, status: "deleted" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

async function subscribeIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "issue");
  await glabExec(["issue", "subscribe", String(num)], ctx);

  const help = getSuggestions({ domain: "issue", action: "subscribe", id: num, repo: ctx });
  return renderOutput([
    renderDetail("issue", { number: num, status: "subscribed" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

async function unsubscribeIssue(args: string[], ctx?: RepoContext): Promise<string> {
  const num = requireNumber(getPositional(args, 1), "issue");
  await glabExec(["issue", "unsubscribe", String(num)], ctx);

  const help = getSuggestions({ domain: "issue", action: "unsubscribe", id: num, repo: ctx });
  return renderOutput([
    renderDetail("issue", { number: num, status: "unsubscribed" }, [field("number"), field("status")]),
    renderHelp(help),
  ]);
}

export async function issueCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const sub = args[0];

  if (!sub || hasFlag(args, "--help")) {
    const blocks: string[] = [ISSUE_HELP];
    return renderOutput(blocks);
  }

  switch (sub) {
    case "list":
      return listIssues(args, ctx);
    case "view":
      return viewIssue(args, ctx);
    case "create":
      return createIssue(args, ctx);
    case "note":
    case "comment":
      return noteIssue(args, ctx);
    case "update":
      return updateIssue(args, ctx);
    case "close":
      return closeIssue(args, ctx);
    case "reopen":
    case "open":
      return reopenIssue(args, ctx);
    case "delete":
    case "del":
      return deleteIssue(args, ctx);
    case "subscribe":
      return subscribeIssue(args, ctx);
    case "unsubscribe":
      return unsubscribeIssue(args, ctx);
    default:
      return renderError(`Unknown issue subcommand: ${sub}`, "VALIDATION_ERROR", [
        "Run `glab-axi issue --help` for usage",
      ]);
  }
}
