import type { RepoContext } from "../context.js";
import { glabJson, glabExec } from "../glab.js";
import { AxiError } from "../errors.js";
import { getSuggestions } from "../suggestions.js";
import { getFlag } from "../args.js";
import {
  field,
  lower,
  renderList,
  renderDetail,
  renderHelp,
  renderError,
  renderOutput,
  type FieldDef,
} from "../toon.js";
import { formatCountLine } from "../format.js";

export const REPO_HELP = `usage: glab-axi repo <subcommand> [flags]
subcommands[6]:
  list, view, create, search, find, lookup
flags{list}:
  --limit <n> (default 30), --visibility <private|internal|public>
flags{create}:
  --group <group>, --description <text>, --visibility <private|internal|public>
flags{search}:
  --search <string> (required)
aliases:
  find -> search, lookup -> search
examples:
  glab-axi repo list
  glab-axi repo view
  glab-axi repo create my-project
  glab-axi repo search --search "cli tool"`;

const listSchema: FieldDef[] = [
  field("path_with_namespace", "name"),
  field("description"),
  lower("visibility"),
  field("star_count", "stars"),
];

const viewSchema: FieldDef[] = [
  field("path_with_namespace", "name"),
  field("description"),
  lower("visibility"),
  field("web_url", "url"),
  field("star_count", "stars"),
  field("forks_count", "forks"),
  field("default_branch", "branch"),
];

async function listRepos(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return REPO_HELP;
  const limit = getFlag(args, "--limit") ?? "30";
  const visibility = getFlag(args, "--visibility");

  const glabArgs = ["repo", "list", "--output", "json", "--per-page", limit];
  if (visibility) glabArgs.push("--visibility", visibility);

  const repos = await glabJson<Record<string, unknown>[]>(glabArgs, ctx);
  const isEmpty = repos.length === 0;
  const limitNum = Number(limit);
  const countLine = formatCountLine({ count: repos.length, limit: limitNum });
  const help = getSuggestions({
    domain: "repo",
    action: "list",
    isEmpty,
    repo: ctx,
  });

  return renderOutput([
    countLine,
    renderList("repos", repos, listSchema),
    renderHelp(help),
  ]);
}

async function viewRepo(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return REPO_HELP;
  const item = await glabJson<Record<string, unknown>>(
    ["repo", "view", "--output", "json"],
    ctx,
  );

  const help = getSuggestions({ domain: "repo", action: "view", repo: ctx });
  return renderOutput([
    renderDetail("repo", item, viewSchema),
    renderHelp(help),
  ]);
}

async function createRepo(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return REPO_HELP;
  const positionals = args.filter((a) => !a.startsWith("--"));
  const name = positionals[1];
  if (!name)
    throw new AxiError(
      "Repository name is required: glab-axi repo create <name>",
      "VALIDATION_ERROR",
    );

  const glabArgs = ["repo", "create", name];
  const group = getFlag(args, "--group");
  if (group) glabArgs.push("--group", group);
  const description = getFlag(args, "--description");
  if (description) glabArgs.push("--description", description);
  const visibility = getFlag(args, "--visibility");
  if (visibility) glabArgs.push("--visibility", visibility);

  const output = await glabExec(glabArgs, ctx);

  const help = getSuggestions({ domain: "repo", action: "create", repo: ctx });
  return renderOutput([
    renderDetail("created", { name: name, output: output.trim() }, [
      field("name"),
      field("output"),
    ]),
    renderHelp(help),
  ]);
}

async function searchRepos(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return REPO_HELP;
  const search = getFlag(args, "--search") ?? getFlag(args, "-s");
  if (!search) throw new AxiError("--search is required", "VALIDATION_ERROR");

  const repos = await glabJson<Record<string, unknown>[]>(
    ["repo", "search", "--output", "json", "--search", search],
    ctx,
  );

  const help = getSuggestions({ domain: "search", action: "repos", repo: ctx });
  return renderOutput([
    formatCountLine({ count: repos.length }),
    renderList("repos", repos, listSchema),
    renderHelp(help),
  ]);
}

export async function repoCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const sub = args[0];

  if (sub === "--help" || sub === undefined) return REPO_HELP;

  switch (sub) {
    case "list":
      return listRepos(args, ctx);
    case "view":
      return viewRepo(args, ctx);
    case "create":
      return createRepo(args, ctx);
    case "search":
    case "find":
    case "lookup":
      return searchRepos(args, ctx);
    default:
      return renderError(`Unknown subcommand: ${sub}`, "VALIDATION_ERROR", [
        "Available subcommands: list, view, create, search, find, lookup",
      ]);
  }
}
