import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
}));

import { repoCommand, REPO_HELP } from "../src/repo.js";

describe("repoCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(repoCommand([])).resolves.toBe(REPO_HELP);
  });

  it("renders repo view output", async () => {
    glabJson.mockResolvedValueOnce({
      path_with_namespace: "group/project",
      web_url: "https://gitlab.com/group/project",
      description: "Project summary",
    });

    const output = await repoCommand(["view"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("project: group/project");
    expect(output).toContain('web: "https://gitlab.com/group/project"');
    expect(output).toContain("description: Project summary");
    expect(glabJson).toHaveBeenCalledWith(
      ["repo", "view", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(repoCommand(["unknown"])).rejects.toThrow(
      "Unknown repo subcommand",
    );
  });
});
