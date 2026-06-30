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

import { issueCommand, ISSUE_HELP } from "../src/commands/issue.js";

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

    expect(output).toContain("issues[");
    expect(output).toContain("Fix login");
    expect(glabJson).toHaveBeenCalledWith(
      ["issue", "list", "--output", "json", "--per-page", "30"],
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

  it("renders issue create structured output", async () => {
    glabExec.mockResolvedValueOnce(
      "https://gitlab.com/group/project/-/issues/42",
    );
    glabJson.mockResolvedValueOnce({
      iid: 42,
      title: "Fix login",
      state: "opened",
      web_url: "https://gitlab.com/group/project/-/issues/42",
    });

    const output = await issueCommand(["create", "--title", "Fix login"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("Fix login");
    expect(output).toContain("state: opened");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "create", "--title", "Fix login"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue note structured output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await issueCommand(
      ["note", "42", "--message", "closing because !123 was merged"],
      {
        owner: "group",
        name: "project",
        nwo: "group/project",
        source: "flag",
      },
    );

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "note", "42", "--message", "closing because !123 was merged"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("treats issue comment as note", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await issueCommand(
      ["comment", "42", "--message", "closing because !123 was merged"],
      {
        owner: "group",
        name: "project",
        nwo: "group/project",
        source: "flag",
      },
    );

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "note", "42", "--message", "closing because !123 was merged"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue update structured output", async () => {
    glabExec.mockResolvedValueOnce("");
    glabJson.mockResolvedValueOnce({
      iid: 42,
      title: "Updated",
      state: "opened",
      labels: [],
    });

    const output = await issueCommand(["update", "42", "--label", "bug"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("title: Updated");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "update", "42", "--label", "bug"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue close structured output", async () => {
    glabJson.mockResolvedValueOnce({ state: "opened" });
    glabExec.mockResolvedValueOnce("");
    glabJson.mockResolvedValueOnce({ iid: 42, state: "closed" });

    const output = await issueCommand(["close", "42"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("state: closed");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "close", "42"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue delete structured output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await issueCommand(["delete", "42"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: deleted");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "delete", "42", "--yes"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue reopen structured output", async () => {
    glabJson.mockResolvedValueOnce({ state: "closed" });
    glabExec.mockResolvedValueOnce("");
    glabJson.mockResolvedValueOnce({ iid: 42, state: "opened" });

    const output = await issueCommand(["reopen", "42"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("state: opened");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "reopen", "42"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("returns issue view help when asked", async () => {
    await expect(issueCommand(["view", "--help"])).resolves.toBe(ISSUE_HELP);
  });

  it("returns issue create help when asked", async () => {
    await expect(issueCommand(["create", "--help"])).resolves.toBe(ISSUE_HELP);
  });

  it("returns issue note help when asked", async () => {
    await expect(issueCommand(["note", "--help"])).resolves.toBe(ISSUE_HELP);
  });

  it("returns issue update help when asked", async () => {
    await expect(issueCommand(["update", "--help"])).resolves.toBe(ISSUE_HELP);
  });

  it("returns issue close help when asked", async () => {
    await expect(issueCommand(["close", "--help"])).resolves.toBe(ISSUE_HELP);
  });

  it("returns issue delete help when asked", async () => {
    await expect(issueCommand(["delete", "--help"])).resolves.toBe(ISSUE_HELP);
  });

  it("returns issue reopen help when asked", async () => {
    await expect(issueCommand(["reopen", "--help"])).resolves.toBe(ISSUE_HELP);
  });

  it("returns issue subscribe help when asked", async () => {
    await expect(issueCommand(["subscribe", "--help"])).resolves.toBe(
      ISSUE_HELP,
    );
  });

  it("returns issue unsubscribe help when asked", async () => {
    await expect(issueCommand(["unsubscribe", "--help"])).resolves.toBe(
      ISSUE_HELP,
    );
  });

  it("treats issue open as reopen", async () => {
    glabJson.mockResolvedValueOnce({ state: "closed" });
    glabExec.mockResolvedValueOnce("");
    glabJson.mockResolvedValueOnce({ iid: 42, state: "opened" });

    const output = await issueCommand(["open", "42"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("state: opened");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "reopen", "42"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue subscribe structured output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await issueCommand(["subscribe", "42"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: subscribed");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "subscribe", "42"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders issue unsubscribe structured output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await issueCommand(["unsubscribe", "42"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: unsubscribed");
    expect(glabExec).toHaveBeenCalledWith(
      ["issue", "unsubscribe", "42"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(issueCommand(["unknown"])).resolves.toContain(
      'error: "Unknown issue subcommand',
    );
  });
});
