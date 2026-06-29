import { AxiError } from "axi-sdk-js";

export type ErrorCode =
  | "REPO_NOT_FOUND"
  | "NOT_FOUND"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "GLAB_NOT_INSTALLED"
  | "UNKNOWN";

type ErrorPattern = {
  pattern: RegExp;
  code: ErrorCode;
  message: (match: RegExpMatchArray, stderr: string) => string;
  suggestions?: (match: RegExpMatchArray) => string[];
};

const patterns: ErrorPattern[] = [
  {
    pattern: /Could not resolve to a Project with the name '([^']+)'/,
    code: "REPO_NOT_FOUND",
    message: (match) => `Project "${match[1]}" not found`,
    suggestions: () => ["Run `glab repo list` to see available projects"],
  },
  {
    pattern: /project (\d+) not found/i,
    code: "NOT_FOUND",
    message: (match) => `Project #${match[1]} does not exist`,
  },
  {
    pattern: /issue (\d+) not found/i,
    code: "NOT_FOUND",
    message: (match) => `Issue #${match[1]} does not exist`,
  },
  {
    pattern: /merge request (\d+) not found/i,
    code: "NOT_FOUND",
    message: (match) => `Merge request #${match[1]} does not exist`,
  },
  {
    pattern: /release with tag "([^"]+)" not found/i,
    code: "NOT_FOUND",
    message: (match) => `Release "${match[1]}" not found`,
    suggestions: () => ["Run `glab release list` to see available releases"],
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
    message: (_match, stderr) => {
      const messageMatch = stderr.match(/"message"\s*:\s*"([^"]+)"/);
      return messageMatch ? messageMatch[1] : "Validation error";
    },
  },
];

function firstErrorLine(stderr: string): string {
  return stderr.trim().split("\n")[0] ?? "";
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
