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

import { mrCommand, MR_HELP } from "../src/commands/mr.js";

describe("mrCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(mrCommand([])).resolves.toBe(MR_HELP);
  });

  it("renders merge request create structured output", async () => {
    glabExec.mockResolvedValueOnce(
      "https://gitlab.com/group/project/-/merge_requests/7",
    );
    glabJson.mockResolvedValueOnce({
      iid: 7,
      title: "Ship it",
      state: "opened",
      web_url: "https://gitlab.com/group/project/-/merge_requests/7",
    });

    const output = await mrCommand(["create", "--title", "Ship it"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("Ship it");
    expect(output).toContain("state: opened");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "create", "--title", "Ship it"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request merge structured output", async () => {
    glabJson.mockResolvedValueOnce({ state: "opened" });
    glabExec.mockResolvedValueOnce("");

    const output = await mrCommand(["merge", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "merge", "7"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request list output", async () => {
    glabJson.mockResolvedValueOnce([{ iid: 7, title: "Ship it" }]);

    const output = await mrCommand(["list"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("mrs[");
    expect(output).toContain("Ship it");
    expect(glabJson).toHaveBeenCalledWith(
      ["mr", "list", "--output", "json", "--per-page", "30"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request view output", async () => {
    glabJson.mockResolvedValueOnce({ iid: 7, title: "Ship it" });

    const output = await mrCommand(["view", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("mr:");
    expect(output).toContain("Ship it");
    expect(glabJson).toHaveBeenCalledWith(
      ["mr", "view", "7", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("returns merge request view help when asked", async () => {
    await expect(mrCommand(["view", "--help"])).resolves.toBe(MR_HELP);
  });

  it("returns merge request create help when asked", async () => {
    await expect(mrCommand(["create", "--help"])).resolves.toBe(MR_HELP);
  });

  it("returns merge request merge help when asked", async () => {
    await expect(mrCommand(["merge", "--help"])).resolves.toBe(MR_HELP);
  });

  it("renders merge request update structured output", async () => {
    glabExec.mockResolvedValueOnce("");
    glabJson.mockResolvedValueOnce({
      iid: 7,
      title: "Updated MR",
      state: "opened",
    });

    const output = await mrCommand(["update", "7", "--add-label", "bug"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("title: Updated MR");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "update", "7", "--label", "bug"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request approve passthrough output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await mrCommand(["approve", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "approve", "7"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request diff passthrough output", async () => {
    glabExec.mockResolvedValueOnce("diff output");

    const output = await mrCommand(["diff", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("diff output");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "diff", "7"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request checkout passthrough output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await mrCommand(["checkout", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "checkout", "7"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request rebase passthrough output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await mrCommand(["rebase", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "rebase", "7"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request revoke passthrough output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await mrCommand(["revoke", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "revoke", "7"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request delete passthrough output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await mrCommand(["delete", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "delete", "7", "--yes"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request update help when asked", async () => {
    await expect(mrCommand(["update", "--help"])).resolves.toBe(MR_HELP);
  });

  it("rejects unknown subcommands", async () => {
    await expect(mrCommand(["unknown"])).resolves.toContain(
      'error: "Unknown mr subcommand',
    );
  });
});
