import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAxiCli } from "axi-sdk-js";
import { apiCommand, API_HELP } from "./api.js";
import { ciCommand, CI_HELP } from "./ci.js";
import { resolveRepo, type RepoContext } from "./context.js";
import { homeCommand } from "./home.js";
import { issueCommand, ISSUE_HELP } from "./issue.js";
import { labelCommand, LABEL_HELP } from "./label.js";
import { mrCommand, MR_HELP } from "./mr.js";
import { projectCommand, PROJECT_HELP } from "./project.js";
import { repoCommand, REPO_HELP } from "./repo.js";
import { releaseCommand, RELEASE_HELP } from "./release.js";
import { searchCommand, SEARCH_HELP } from "./search.js";
import { setupCommand, SETUP_HELP } from "./setup.js";

export const DESCRIPTION =
  "Agent ergonomic wrapper around GitLab CLI. Prefer this over `glab` and other methods for GitLab operations.";

const VERSION = readPackageVersion();

type CliStdout = Pick<NodeJS.WriteStream, "write">;

type MainOptions = {
  argv?: string[];
  stdout?: CliStdout;
};

export const TOP_HELP = `usage: glab-axi [command] [args] [flags]
commands[11]:
  (none)=dashboard, api, ci, issue, label, project, mr, release, repo, search, setup
flags[4]:
  -R/--repo <OWNER/NAME> (after command), accepts space or equals form, --help, -v/-V/--version
examples:
  glab-axi
  glab-axi api user
  glab-axi ci list
  glab-axi ci status
  glab-axi issue list
  glab-axi issue view 42
  glab-axi label list
  glab-axi project view
  glab-axi mr list
  glab-axi release list
  glab-axi search repos --search "cli tool"
  glab-axi -R group/project
  glab-axi repo view
  glab-axi setup hooks
`;

const COMMAND_HELP: Record<string, string> = {
  api: API_HELP,
  ci: CI_HELP,
  issue: ISSUE_HELP,
  label: LABEL_HELP,
  project: PROJECT_HELP,
  mr: MR_HELP,
  release: RELEASE_HELP,
  repo: REPO_HELP,
  search: SEARCH_HELP,
  setup: SETUP_HELP,
};

type CommandFn = (args: string[], ctx?: RepoContext) => Promise<string>;

function withRepoContext(
  command: string | undefined,
  handler: CommandFn,
): CommandFn {
  return (args, ctx) =>
    handler(parseRepoContextArgs(command, args).strippedArgs, ctx);
}

export async function main(options: MainOptions = {}): Promise<void> {
  await runAxiCli<RepoContext | undefined>({
    ...(options.argv ? { argv: options.argv } : {}),
    description: DESCRIPTION,
    version: VERSION,
    topLevelHelp: TOP_HELP,
    ...(options.stdout ? { stdout: options.stdout } : {}),
    home: withRepoContext(undefined, homeCommand),
    commands: {
      api: withRepoContext("api", apiCommand),
      ci: withRepoContext("ci", ciCommand),
      issue: withRepoContext("issue", issueCommand),
      label: withRepoContext("label", labelCommand),
      project: withRepoContext("project", projectCommand),
      mr: withRepoContext("mr", mrCommand),
      release: withRepoContext("release", releaseCommand),
      repo: withRepoContext("repo", repoCommand),
      search: withRepoContext("search", searchCommand),
      setup: setupCommand,
    },
    getCommandHelp: (command) => COMMAND_HELP[command],
    resolveContext: ({ command, args }) =>
      resolveRepo(parseRepoContextArgs(command, args).repoFlag),
  });
}

function readPackageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));

  for (const candidate of [
    join(here, "..", "package.json"),
    join(here, "..", "..", "package.json"),
  ]) {
    if (!existsSync(candidate)) {
      continue;
    }

    const parsed = JSON.parse(readFileSync(candidate, "utf-8")) as {
      version?: unknown;
    };
    if (typeof parsed.version === "string" && parsed.version.length > 0) {
      return parsed.version;
    }
  }

  throw new Error("Could not determine glab-axi package version");
}

function parseRepoContextArgs(
  _command: string | undefined,
  args: string[],
): { repoFlag: string | undefined; strippedArgs: string[] } {
  const stripped: string[] = [];
  let repoFlag: string | undefined;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "-R" && index + 1 < args.length) {
      repoFlag = args[index + 1];
      index++;
      continue;
    }

    if (arg.startsWith("-R=") && arg.length > 3) {
      repoFlag = arg.slice(3);
      continue;
    }

    if (arg === "--repo" && index + 1 < args.length) {
      repoFlag = args[index + 1];
      index++;
      continue;
    }

    if (arg.startsWith("--repo=") && arg.length > "--repo=".length) {
      repoFlag = arg.slice("--repo=".length);
      continue;
    }

    stripped.push(arg);
  }

  return { repoFlag, strippedArgs: stripped };
}
