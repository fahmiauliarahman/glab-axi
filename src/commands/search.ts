import type { RepoContext } from "../context.js";
import { glabJson } from "../glab.js";
import { AxiError } from "../errors.js";
import { getFlag } from "../args.js";
import { getSuggestions } from "../suggestions.js";
import {
  field,
  lower,
  renderList,
  renderHelp,
  renderError,
  renderOutput,
  type FieldDef,
} from "../toon.js";
import { formatCountLine } from "../format.js";

export const SEARCH_HELP = `usage: glab-axi search <type> --search <query> [flags]
types[4]:
  repos, issues, mrs, code
flags{common}:
  --search <query> (required), --order-by <created_at|updated_at>, --sort <asc|desc>
examples:
  glab-axi search repos --search "cli tool"
  glab-axi search issues --search "login bug"
  glab-axi search mrs --search "feature"`;

const repoSchema: FieldDef[] = [
  field("path_with_namespace", "name"),
  field("description"),
  lower("visibility"),
  field("star_count", "stars"),
];

async function searchRepos(args: string[], ctx?: RepoContext): Promise<string> {
  const query = getFlag(args, "--search") ?? getFlag(args, "-s");
  if (!query) throw new AxiError("--search is required", "VALIDATION_ERROR");

  const repos = await glabJson<Record<string, unknown>[]>(
    ["repo", "search", "--output", "json", "--search", query],
    ctx,
  );

  const countLine = formatCountLine({ count: repos.length });
  const help = getSuggestions({ domain: "search", action: "repos", repo: ctx });

  return renderOutput([
    countLine,
    renderList("repos", repos, repoSchema),
    renderHelp(help),
  ]);
}

async function searchIssues(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const query = getFlag(args, "--search") ?? getFlag(args, "-s");
  if (!query) throw new AxiError("--search is required", "VALIDATION_ERROR");

  const issues = await glabJson<Record<string, unknown>[]>(
    [
      "issue",
      "list",
      "--output",
      "json",
      "--search",
      query,
      "--per-page",
      "30",
    ],
    ctx,
  );

  const countLine = formatCountLine({ count: issues.length });
  const help = getSuggestions({
    domain: "search",
    action: "issues",
    repo: ctx,
  });

  return renderOutput([
    countLine,
    renderList("issues", issues, [
      field("iid", "number"),
      field("title"),
      lower("state"),
    ]),
    renderHelp(help),
  ]);
}

async function searchMrs(args: string[], ctx?: RepoContext): Promise<string> {
  const query = getFlag(args, "--search") ?? getFlag(args, "-s");
  if (!query) throw new AxiError("--search is required", "VALIDATION_ERROR");

  const mrs = await glabJson<Record<string, unknown>[]>(
    ["mr", "list", "--output", "json", "--search", query, "--per-page", "30"],
    ctx,
  );

  const countLine = formatCountLine({ count: mrs.length });
  const help = getSuggestions({ domain: "search", action: "mrs", repo: ctx });

  return renderOutput([
    countLine,
    renderList("mrs", mrs, [
      field("iid", "number"),
      field("title"),
      lower("state"),
    ]),
    renderHelp(help),
  ]);
}

export async function searchCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const sub = args[0];

  if (sub === "--help" || sub === undefined) return SEARCH_HELP;

  switch (sub) {
    case "repos":
      return searchRepos(args, ctx);
    case "issues":
      return searchIssues(args, ctx);
    case "mrs":
      return searchMrs(args, ctx);
    default:
      return renderError(`Unknown search type: ${sub}`, "VALIDATION_ERROR", [
        "Available types: repos, issues, mrs, code",
      ]);
  }
}
