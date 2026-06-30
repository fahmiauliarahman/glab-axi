import { AxiError, exitCodeForError } from "axi-sdk-js";

export type ErrorCode =
  | "REPO_NOT_FOUND"
  | "NOT_FOUND"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "GLAB_NOT_INSTALLED"
  | "UNKNOWN";

export { AxiError, exitCodeForError };

interface ErrorPattern {
  pattern: RegExp;
  code: ErrorCode;
  message: (match: RegExpMatchArray, stderr: string) => string;
  suggestions?: (match: RegExpMatchArray) => string[];
}

const patterns: ErrorPattern[] = [
  {
    pattern: /Could not resolve to a Project with the name '([^']+)'/,
    code: "REPO_NOT_FOUND",
    message: (m) => `Project "${m[1]}" not found`,
    suggestions: () => ["Run `glab-axi repo list` to see available projects"],
  },
  {
    pattern: /project (\d+) not found/i,
    code: "NOT_FOUND",
    message: (m) => `Project #${m[1]} does not exist`,
  },
  {
    pattern: /issue (\d+) not found/i,
    code: "NOT_FOUND",
    message: (m) => `Issue #${m[1]} does not exist`,
  },
  {
    pattern: /merge request (\d+) not found/i,
    code: "NOT_FOUND",
    message: (m) => `Merge request #${m[1]} does not exist`,
  },
  {
    pattern: /pipeline (\d+) not found/i,
    code: "NOT_FOUND",
    message: (m) => `Pipeline #${m[1]} not found`,
    suggestions: () => ["Run `glab-axi ci list` to see recent pipelines"],
  },
  {
    pattern: /release with tag "([^"]+)" not found/i,
    code: "NOT_FOUND",
    message: (m) => `Release "${m[1]}" not found`,
    suggestions: () => [
      "Run `glab-axi release list` to see available releases",
    ],
  },
  {
    pattern:
      /None of the git remotes configured for this repository point to a known GitLab host/i,
    code: "VALIDATION_ERROR",
    message: () =>
      "GitLab repo not detected for current checkout - pass `--repo owner/name` or set `GLAB_REPO`",
    suggestions: () => [
      "Run `glab-axi issue list --repo owner/name`",
      "Set `GLAB_REPO=owner/name` when working outside GitLab clone",
    ],
  },
  {
    pattern: /glab auth login/i,
    code: "AUTH_REQUIRED",
    message: () => "GitLab auth required - run `glab auth login` first",
  },
  {
    pattern: /HTTP 403/,
    code: "FORBIDDEN",
    message: () => "Insufficient permissions for this action",
  },
  {
    pattern: /HTTP 429|too many requests|rate limit/i,
    code: "RATE_LIMITED",
    message: () => "GitLab API rate limit hit - wait and retry",
  },
  {
    pattern: /HTTP 422/,
    code: "VALIDATION_ERROR",
    message: (_m, stderr) => {
      const msgMatch = stderr.match(/"message"\s*:\s*"([^"]+)"/);
      return msgMatch ? msgMatch[1] : "Validation error";
    },
  },
];

function firstErrorLine(stderr: string): string {
  return (
    stderr
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? ""
  );
}

export function mapGlabError(stderr: string, exitCode: number): AxiError {
  for (const { pattern, code, message, suggestions } of patterns) {
    const match = stderr.match(pattern);
    if (match) {
      return new AxiError(
        message(match, stderr),
        code,
        suggestions?.(match) ?? [],
      );
    }
  }

  if (/not found/i.test(stderr)) {
    return new AxiError(firstErrorLine(stderr), "NOT_FOUND");
  }

  return new AxiError(
    firstErrorLine(stderr) || `glab exited with code ${exitCode}`,
    "UNKNOWN",
  );
}

export function glabNotInstalledError(): AxiError {
  return new AxiError(
    "glab CLI is not installed - see https://gitlab.com/gitlab-org/cli",
    "GLAB_NOT_INSTALLED",
  );
}
