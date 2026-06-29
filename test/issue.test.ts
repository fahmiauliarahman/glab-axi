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
  ISSUE_CLOSE_HELP,
  issueCommand,
  ISSUE_CREATE_HELP,
  ISSUE_HELP,
  ISSUE_NOTE_HELP,
  ISSUE_UPDATE_HELP,
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

  it("renders issue note passthrough output", async () => {
    glabExec.mockResolvedValueOnce("Created note on issue #42");

    const output = await issueCommand(
      ["note", "42", "--message", "closing because !123 was merged"],
      {
        owner: "group",
        name: "project",
        nwo: "group/project",
        source: "flag",
      },
    );

    expect(output).toContain("Created note on issue #42");
    expect(output).toContain("Use `glab-axi issue note --help`");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "note", "42", "--message", "closing because !123 was merged"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue update passthrough output", async () => {
    glabExec.mockResolvedValueOnce("Updated issue #42");

    const output = await issueCommand(["update", "42", "--label", "bug"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("Updated issue #42");
    expect(output).toContain("Use `glab-axi issue update --help`");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "update", "42", "--label", "bug"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue close passthrough output", async () => {
    glabExec.mockResolvedValueOnce("Closed issue #42");

    const output = await issueCommand(["close", "42"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("Closed issue #42");
    expect(output).toContain("Use `glab-axi issue close --help`");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "close", "42"],
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

  it("returns issue note help when asked", async () => {
    await expect(issueCommand(["note", "--help"])).resolves.toBe(
      ISSUE_NOTE_HELP,
    );
  });

  it("returns issue update help when asked", async () => {
    await expect(issueCommand(["update", "--help"])).resolves.toBe(
      ISSUE_UPDATE_HELP,
    );
  });

  it("returns issue close help when asked", async () => {
    await expect(issueCommand(["close", "--help"])).resolves.toBe(
      ISSUE_CLOSE_HELP,
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(issueCommand(["unknown"])).rejects.toThrow(
      "Unknown issue subcommand",
    );
  });
});
