import { describe, expect, it } from "vitest";
import { AxiError } from "axi-sdk-js";
import { glabNotInstalledError, mapGlabError } from "../src/errors.js";

describe("mapGlabError", () => {
  it("maps project not found", () => {
    const err = mapGlabError(
      "Could not resolve to a Project with the name 'group/project'",
      1,
    );

    expect(err).toBeInstanceOf(AxiError);
    expect(err.code).toBe("REPO_NOT_FOUND");
    expect(err.message).toContain("group/project");
  });

  it("maps issue not found", () => {
    const err = mapGlabError("issue 42 not found", 1);

    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toContain("42");
  });

  it("maps merge request not found", () => {
    const err = mapGlabError("merge request 7 not found", 1);

    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toContain("7");
  });

  it("maps auth required", () => {
    const err = mapGlabError("run glab auth login first", 1);

    expect(err.code).toBe("AUTH_REQUIRED");
  });

  it("maps missing GitLab remote to repo hint", () => {
    const err = mapGlabError(
      "\n  ERROR  \n\nNone of the git remotes configured for this repository point to a known GitLab host.\nConfigured remotes: github.com.\n",
      1,
    );

    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toContain("pass `--repo owner/name`");
  });

  it("maps validation errors", () => {
    const err = mapGlabError('HTTP 422 {"message": "Validation Failed"}', 1);

    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("Validation Failed");
  });

  it("falls back to UNKNOWN for empty stderr", () => {
    const err = mapGlabError("", 2);

    expect(err.code).toBe("UNKNOWN");
    expect(err.message).toContain("code 2");
  });
});

describe("glabNotInstalledError", () => {
  it("returns install hint", () => {
    const err = glabNotInstalledError();

    expect(err.code).toBe("GLAB_NOT_INSTALLED");
    expect(err.message).toContain("glab CLI");
  });
});
