import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

const { glabExec } = vi.hoisted(() => ({
  glabExec: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
  glabExec,
}));

import {
  issueCommand,
  ISSUE_CREATE_HELP,
  ISSUE_HELP,
  ISSUE_VIEW_HELP,
} from "../src/issue.js";

describe("issueCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(issueCommand([])).resolves.toBe(ISSUE_HELP);
  });

  it("renders issue list output", async () => {
    glabJson.mockResolvedValueOnce([{ iid: 1, title: "Fix login" }]);

    const output = await issueCommand(["list"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("issues:");
    expect(output).toContain("Fix login");
    expect(glabJson).toHaveBeenCalledWith(
      ["issue", "list", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue view output", async () => {
    glabJson.mockResolvedValueOnce({ iid: 42, title: "Fix login" });

    const output = await issueCommand(["view", "42"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("issue:");
    expect(output).toContain("Fix login");
    expect(glabJson).toHaveBeenCalledWith(
      ["issue", "view", "42", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue create passthrough output", async () => {
    glabExec.mockResolvedValueOnce("Created issue #43");

    const output = await issueCommand(["create", "--title", "Fix login"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("Created issue #43");
    expect(output).toContain("Use `glab-axi issue create --help`");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "create", "--title", "Fix login"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("returns issue view help when asked", async () => {
    await expect(issueCommand(["view", "--help"])).resolves.toBe(
      ISSUE_VIEW_HELP,
    );
  });

  it("returns issue create help when asked", async () => {
    await expect(issueCommand(["create", "--help"])).resolves.toBe(
      ISSUE_CREATE_HELP,
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(issueCommand(["unknown"])).rejects.toThrow(
      "Unknown issue subcommand",
    );
  });
});
