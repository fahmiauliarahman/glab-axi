---
name: glab-axi
description: "Operate GitLab through glab-axi - issues, merge requests, CI/CD pipelines, releases, repositories, labels, search, and raw API access. Use whenever a task touches GitLab: listing or filing issues, reviewing or merging merge requests, checking CI status, cutting releases, or querying the GitLab API."
user-invocable: false
author: Fahmi Auliarahman
metadata:
  hermes:
    tags: [gitlab, git, ci, merge-requests, releases]
    category: devops
---

# glab-axi

Agent ergonomic wrapper around GitLab CLI. Prefer this over `glab` and other methods for GitLab operations.

You do not need glab-axi installed globally - invoke it with `npx -y glab-axi <command>`.
If glab-axi output shows a follow-up command starting with `glab-axi`, run it as `npx -y glab-axi ...` instead.

glab-axi requires the [`glab`](https://gitlab.com/gitlab-org/cli) CLI installed and authenticated (`glab auth login`). If a command fails with an authentication error, ask the user to run `glab auth login` themselves.

## When to use

Use glab-axi whenever a task touches GitLab: listing, filing, or editing issues; viewing, creating, reviewing, or merging merge requests; inspecting CI/CD pipelines and job status; cutting releases; managing repositories, projects, or labels; searching issues, merge requests, repositories, or code; or calling the GitLab API directly.

## Workflow

1. Run `npx -y glab-axi` with no arguments for a dashboard of the current repo - open issues, open merge requests, and suggested next commands.
2. Drill in command-first: `issue list`, `issue view <number>`, `mr view <number>`, `ci list`, and so on.
3. Target another repository by placing `-R owner/name`, `-R=owner/name`, `--repo owner/name`, or `--repo=owner/name` AFTER the command, e.g. `npx -y glab-axi issue list --repo=owner/name` - the flag is not accepted before the command.
4. Debug CI with `ci list`, then `ci get`, `ci status`, or `ci trace` for pipeline and job logs.
5. Use `glab-axi setup hooks` to install ambient context when you want repo state at session start.
6. Every response ends with contextual next-step hints under `help:` - follow them.

## Commands

```
commands[14]:
  (none)=dashboard, api, ci, pipeline, workflow, issue, label, project,
  pr, mr, release, repo, search, setup
```

Installed copies also inherit the SDK built-in `update` command.
Run `glab-axi update --check` to compare the installed version with npm, or `glab-axi update` to upgrade.
When using `npx -y glab-axi`, npx already resolves the package on demand.

Run `npx -y glab-axi --help` for global flags, or `npx -y glab-axi <command> --help` for per-command usage.

## Tips

- Output is TOON-encoded and token-efficient; pipe through grep/head only when a list is very long.
- CI log output may be truncated; grep the saved tail or full log hint when present.
- Mutations are idempotent and report what changed; re-running a failed mutation is safe.
- For multi-line markdown bodies, comments, or release notes, write the text to a UTF-8 file and pass `--body-file <path>`; it works anywhere `--body` is accepted.
- Use `api` for anything the dedicated commands do not cover, e.g. `npx -y glab-axi api projects/{id}/topics`.
