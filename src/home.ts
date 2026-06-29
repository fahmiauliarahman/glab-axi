import type { RepoContext } from "./context.js";
import { glabJson } from "./glab.js";
import { renderHelp, renderKeyValueBlock, renderOutput } from "./toon.js";

type Project = {
  path_with_namespace?: string;
  web_url?: string;
};

export async function homeCommand(
  _args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const [project, issues, mrs] = await Promise.all([
    glabJson<Project>(["repo", "view", "--output", "json"], ctx).catch(
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

  if (project?.path_with_namespace) {
    blocks.push(renderKeyValueBlock("project", project.path_with_namespace));
  }

  if (project?.web_url) {
    blocks.push(renderKeyValueBlock("web", project.web_url));
  }

  blocks.push(
    issues.length
      ? `issues:\n  count: ${issues.length}`
      : "issues:\n  count: 0",
  );
  blocks.push(mrs.length ? `mrs:\n  count: ${mrs.length}` : "mrs:\n  count: 0");
  blocks.push(
    renderHelp(["Run `glab-axi setup hooks` to install ambient context"]),
  );

  return renderOutput(blocks);
}
