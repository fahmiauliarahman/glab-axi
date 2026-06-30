import type { RepoContext } from "../context.js";
import { glabJson } from "../glab.js";
import { getSuggestions } from "../suggestions.js";
import { renderHelp, renderOutput, renderDetail, field } from "../toon.js";

export async function homeCommand(
  _args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const [project, issues, mrs] = await Promise.all([
    glabJson<Record<string, unknown>>(["repo", "view", "--output", "json"], ctx).catch(
      () => undefined,
    ),
    glabJson<unknown[]>(
      ["issue", "list", "--output", "json", "--per-page", "3"],
      ctx,
    ).catch(() => []),
    glabJson<unknown[]>(
      ["mr", "list", "--output", "json", "--per-page", "3"],
      ctx,
    ).catch(() => []),
  ]);

  const blocks: string[] = [];

  if (project) {
    const detailSchema = [
      field("path_with_namespace", "project"),
      field("web_url", "web"),
    ];
    blocks.push(renderDetail("dashboard", project, detailSchema));
  }

  blocks.push(
    issues.length
      ? `issues:\n  count: ${issues.length}`
      : "issues:\n  count: 0",
  );
  blocks.push(mrs.length ? `mrs:\n  count: ${mrs.length}` : "mrs:\n  count: 0");

  const help = getSuggestions({ domain: "home", action: "dashboard", repo: ctx });
  blocks.push(renderHelp(help));

  return renderOutput(blocks);
}
