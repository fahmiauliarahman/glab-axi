<h1 align="center">glab-axi</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/glab-axi"><img alt="npm" src="https://img.shields.io/npm/v/glab-axi?style=flat-square" /></a>
  <a href="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square"><img alt="Platform" src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square" /></a>
  <a href="https://img.shields.io/badge/node-%3E%3D20-green?style=flat-square"><img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20-green?style=flat-square" /></a>
</p>

GitLab CLI for agents — designed with [AXI](https://github.com/kunchenguid/axi) (Agent eXperience Interface).

Wraps the official [`glab`](https://gitlab.com/gitlab-org/cli) CLI with token-efficient [TOON](https://github.com/toon-format/toon) output, contextual next-step suggestions, and structured error handling.
Built for autonomous agents that interact with GitLab via shell execution.

## Quick Start

Install the glab-axi skill in the [Agent Skills](https://agentskills.io) format:

```sh
npx skills add fahmiauliarahman/glab-axi --skill glab-axi -g
```

That is the entire setup — no `npm install` needed.
The skill teaches your agent to run glab-axi through `npx -y glab-axi`, so the CLI comes along on demand.
You still need [`glab`](https://gitlab.com/gitlab-org/cli) installed and authenticated via `glab auth login` (Node 20+ required).

The skill is not a user-facing slash command (`user-invocable: false`).
Its frontmatter includes Hermes Agent metadata so Hermes can categorize it as a `devops` skill for GitLab, git, CI, merge requests, and releases.
Just ask for anything that touches GitLab — filing issues, reviewing merge requests, checking CI pipelines, cutting releases — and the agent loads the skill on its own when it recognizes the task.

`-g` installs the skill for all projects (`~/.claude/skills/`, for example); drop it to install for the current project only (`.claude/skills/`).

## Other Ways to Install

### Zero setup

glab-axi is an AXI, so any capable agent can run the CLI directly with nothing installed at all.
Just tell your agent:

```
Execute `npx -y glab-axi` to get GitLab tools.
```

### Global install

```sh
npm install -g glab-axi
```

## Usage

```bash
glab-axi                          # dashboard - live state, no args needed
glab-axi issue list               # list issues in current repo
glab-axi issue view 42            # view issue #42
glab-axi mr list                  # list merge requests
glab-axi mr view 42               # view merge request #42
glab-axi mr merge 42              # merge a merge request
glab-axi ci list                  # list pipelines
glab-axi ci get                   # get pipeline details
glab-axi ci status                # pipeline/job status summary
glab-axi ci trace                 # job log output
glab-axi release list             # list releases
glab-axi repo list -R group       # list repos in a group
glab-axi label list               # list labels
glab-axi project search "query"   # search projects
glab-axi search repos "query"     # search repositories
glab-axi api projects/1/topics    # raw GitLab API access
glab-axi setup hooks              # install agent session hooks
```

For multi-line issue, MR, comment, or release note text, write Markdown to a UTF-8 file and pass `--body-file <path>` anywhere `--body` is accepted.

`glab-axi ci` manages pipelines and jobs: `ci list`, `ci get`, `ci status`, `ci create`, `ci run` (retry), `ci run-trig`, and `ci trace`.
`pr` and `mr` are interchangeable aliases, as are `pipeline`/`workflow` for `ci` and `run` for `ci`.

### Commands

| Command   | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `issue`   | Issues — list, view, create, update, close, delete, reopen, open, comment, subscribe, unsubscribe |
| `mr`/`pr` | Merge requests — list, view, create, merge                         |
| `ci`/`pipeline`/`workflow`/`run` | CI/CD pipelines — list, get, status, create, run, trace |
| `release` | Releases — list, view, create                                      |
| `repo`    | Repositories — list, view, create, search                          |
| `project` | Projects — view, search, find, lookup                              |
| `label`   | Labels — list, create                                              |
| `search`  | Search issues, MRs, repos, code                                    |
| `api`     | Raw GitLab API access                                              |
| `setup`   | Install agent session hooks                                        |
| `update`  | Built-in self-update command inherited from `axi-sdk-js`           |

### Global flags

- `--help` — show help for any command
- `-v`, `-V`, `--version` — show the installed `glab-axi` version

Repository targeting is command-first:

- `glab-axi issue list -R owner/name`
- `glab-axi issue list --repo owner/name`
- `glab-axi issue list --repo=owner/name`

### Session hooks

Install ambient GitLab context at the start of every agent session:

```sh
glab-axi setup hooks
```

This installs a `SessionStart` hook for **Claude Code**, **Codex**, and **OpenCode** that surfaces the current repo state and usage guidance.
**Restart your agent session after running this** so the new hook takes effect.

## Development

```sh
pnpm run build       # Compile TypeScript to dist/
pnpm run build:skill # Regenerate skills/glab-axi/SKILL.md from shared skill source
pnpm run dev         # Run CLI directly with tsx
pnpm test            # Run tests with vitest
pnpm run test:watch  # Run tests in watch mode
```

The committed `skills/glab-axi/SKILL.md` is generated by `pnpm run build:skill`.
The npm package includes `skills/glab-axi/`, so published releases ship the same installable Agent Skill documented in Quick Start.

## License

MIT
