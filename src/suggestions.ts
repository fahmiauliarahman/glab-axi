import type { RepoContext } from "./context.js";

interface SuggestionContext {
  domain: string;
  action: string;
  state?: string;
  isEmpty?: boolean;
  id?: string | number;
  repo?: RepoContext;
}

type SuggestionEntry = {
  match: (ctx: SuggestionContext) => boolean;
  lines: (ctx: SuggestionContext) => string[];
};

function repoFlag(ctx: SuggestionContext): string {
  if (ctx.repo && ctx.repo.source !== "git") {
    return ` -R ${ctx.repo.nwo}`;
  }
  return "";
}

const table: SuggestionEntry[] = [
  // Home
  {
    match: (c) => c.domain === "home",
    lines: () => [
      "Run `glab-axi <command> <subcommand>` - commands: issue, mr, ci, release, repo, label",
    ],
  },

  // Issue list
  {
    match: (c) => c.domain === "issue" && c.action === "list" && !c.isEmpty,
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue view <number>\` to view details`,
      `Run \`glab-axi${repoFlag(c)} issue create --title "..."\` to create`,
    ],
  },
  {
    match: (c) =>
      c.domain === "issue" && c.action === "list" && c.isEmpty === true,
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue create --title "..."\` to create an issue`,
      `Run \`glab-axi${repoFlag(c)} issue list --state closed\` to see closed issues`,
    ],
  },

  // Issue view
  {
    match: (c) =>
      c.domain === "issue" && c.action === "view" && c.state === "opened",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue note ${c.id} -m "..."\` to comment`,
      `Run \`glab-axi${repoFlag(c)} issue close ${c.id}\` to close`,
      `Run \`glab-axi${repoFlag(c)} issue update ${c.id} --assignee <user>\` to assign`,
    ],
  },
  {
    match: (c) =>
      c.domain === "issue" && c.action === "view" && c.state === "closed",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue reopen ${c.id}\` to reopen`,
      `Run \`glab-axi${repoFlag(c)} issue note ${c.id} -m "..."\` to comment`,
    ],
  },

  // Issue create
  {
    match: (c) => c.domain === "issue" && c.action === "create",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue view ${c.id}\` to see the full issue`,
      `Run \`glab-axi${repoFlag(c)} issue update ${c.id} --label <label>\` to label`,
    ],
  },

  // Issue close
  {
    match: (c) => c.domain === "issue" && c.action === "close",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue reopen ${c.id}\` to reopen`,
    ],
  },

  // Issue reopen
  {
    match: (c) => c.domain === "issue" && c.action === "reopen",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue close ${c.id}\` to close`,
      `Run \`glab-axi${repoFlag(c)} issue view ${c.id}\` to see details`,
    ],
  },

  // Issue note/comment
  {
    match: (c) =>
      c.domain === "issue" && (c.action === "note" || c.action === "comment"),
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue view ${c.id} --comments\` to see all notes`,
    ],
  },

  // Issue update
  {
    match: (c) => c.domain === "issue" && c.action === "update",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue view ${c.id}\` to see updated issue`,
    ],
  },

  // Issue delete
  {
    match: (c) => c.domain === "issue" && c.action === "delete",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue list\` to see remaining issues`,
    ],
  },

  // Issue subscribe/unsubscribe
  {
    match: (c) =>
      c.domain === "issue" && ["subscribe", "unsubscribe"].includes(c.action),
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue view ${c.id}\` to see issue details`,
    ],
  },

  // MR list
  {
    match: (c) => c.domain === "mr" && c.action === "list" && !c.isEmpty,
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr view <number>\` to view details`,
      `Run \`glab-axi${repoFlag(c)} mr create --title "..."\` to create`,
    ],
  },
  {
    match: (c) =>
      c.domain === "mr" && c.action === "list" && c.isEmpty === true,
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr create --title "..."\` to create an MR`,
      `Run \`glab-axi${repoFlag(c)} mr list --state closed\` to see closed MRs`,
    ],
  },

  // MR view
  {
    match: (c) =>
      c.domain === "mr" && c.action === "view" && c.state === "opened",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} ci status\` to see pipeline status`,
      `Run \`glab-axi${repoFlag(c)} mr merge ${c.id}\` to merge`,
    ],
  },
  {
    match: (c) =>
      c.domain === "mr" && c.action === "view" && c.state === "closed",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr reopen ${c.id}\` to reopen`,
    ],
  },
  {
    match: (c) =>
      c.domain === "mr" && c.action === "view" && c.state === "merged",
    lines: () => [],
  },

  // MR create
  {
    match: (c) => c.domain === "mr" && c.action === "create",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr view ${c.id}\` to see the full MR`,
      `Run \`glab-axi${repoFlag(c)} ci status\` to monitor pipeline`,
    ],
  },

  // MR update
  {
    match: (c) => c.domain === "mr" && c.action === "update",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr view ${c.id}\` to see updated MR`,
    ],
  },

  // MR merge
  {
    match: (c) => c.domain === "mr" && c.action === "merge",
    lines: () => [],
  },

  // MR approve
  {
    match: (c) => c.domain === "mr" && c.action === "approve",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr merge ${c.id}\` to merge`,
      `Run \`glab-axi${repoFlag(c)} mr view ${c.id}\` to see MR details`,
    ],
  },

  // MR diff
  {
    match: (c) => c.domain === "mr" && c.action === "diff",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr approve ${c.id}\` to approve`,
    ],
  },

  // MR rebase
  {
    match: (c) => c.domain === "mr" && c.action === "rebase",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr view ${c.id}\` to see updated MR`,
    ],
  },

  // MR revoke
  {
    match: (c) => c.domain === "mr" && c.action === "revoke",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr approve ${c.id}\` to re-approve`,
    ],
  },

  // MR delete
  {
    match: (c) => c.domain === "mr" && c.action === "delete",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} mr list\` to see remaining MRs`,
    ],
  },

  // CI list
  {
    match: (c) => c.domain === "ci" && c.action === "list",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} ci get\` to see current pipeline`,
      `Run \`glab-axi${repoFlag(c)} ci status\` to see status`,
    ],
  },

  // CI get/status
  {
    match: (c) => c.domain === "ci" && ["get", "status"].includes(c.action),
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} ci trace <job-id>\` to view job logs`,
    ],
  },

  // CI run
  {
    match: (c) => c.domain === "ci" && c.action === "run",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} ci status\` to monitor pipeline`,
    ],
  },

  // Release list
  {
    match: (c) => c.domain === "release" && c.action === "list",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} release view <tag>\` to view details`,
      `Run \`glab-axi${repoFlag(c)} release create <tag>\` to create a release`,
    ],
  },

  // Release view
  {
    match: (c) => c.domain === "release" && c.action === "view",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} release create ${c.id}\` to create a release`,
    ],
  },

  // Release create
  {
    match: (c) => c.domain === "release" && c.action === "create",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} release view ${c.id}\` to view the release`,
    ],
  },

  // Repo view
  {
    match: (c) => c.domain === "repo" && c.action === "view",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} issue list\` to see issues`,
      `Run \`glab-axi${repoFlag(c)} mr list\` to see merge requests`,
    ],
  },

  // Repo create
  {
    match: (c) => c.domain === "repo" && c.action === "create",
    lines: () => [],
  },

  // Repo list
  {
    match: (c) => c.domain === "repo" && c.action === "list",
    lines: () => [
      "Run `glab-axi repo view -R <owner/name>` to view a repository",
    ],
  },

  // Label list
  {
    match: (c) => c.domain === "label" && c.action === "list",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} label create --name "..." --color "..."\` to create a label`,
    ],
  },

  // Label create
  {
    match: (c) => c.domain === "label" && c.action === "create",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} label list\` to see all labels`,
    ],
  },

  // Label edit
  {
    match: (c) => c.domain === "label" && c.action === "edit",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} label list\` to see all labels`,
    ],
  },

  // Release download/upload
  {
    match: (c) => c.domain === "release" && c.action === "download",
    lines: () => [],
  },
  {
    match: (c) => c.domain === "release" && c.action === "upload",
    lines: (c) => [
      `Run \`glab-axi${repoFlag(c)} release view ${c.id}\` to see all assets`,
    ],
  },

  // Search
  {
    match: (c) => c.domain === "search",
    lines: () => [],
  },

  // API
  {
    match: (c) => c.domain === "api",
    lines: () => [],
  },
];

export function getSuggestions(ctx: SuggestionContext): string[] {
  for (const entry of table) {
    if (entry.match(ctx)) {
      return entry.lines(ctx);
    }
  }
  return [];
}
