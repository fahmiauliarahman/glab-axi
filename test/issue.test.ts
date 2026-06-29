import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
}));

import { issueCommand, ISSUE_HELP } from "../src/issue.js";

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

  it("rejects unknown subcommands", async () => {
    await expect(issueCommand(["unknown"])).rejects.toThrow(
      "Unknown issue subcommand",
    );
  });
});
