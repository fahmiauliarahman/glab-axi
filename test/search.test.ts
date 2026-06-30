import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
}));

import { searchCommand, SEARCH_HELP } from "../src/commands/search.js";

describe("searchCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(searchCommand([])).resolves.toBe(SEARCH_HELP);
  });

  it("renders repo search output", async () => {
    glabJson.mockResolvedValueOnce([
      {
        path_with_namespace: "group/project",
        web_url: "https://gitlab.com/group/project",
        description: "Project summary",
      },
    ]);

    const output = await searchCommand(["repos", "--search", "cli tool"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("repos[");
    expect(output).toContain("group/project");
    expect(glabJson).toHaveBeenCalledWith(
      ["repo", "search", "--output", "json", "--search", "cli tool"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(searchCommand(["unknown"])).resolves.toContain(
      'error: "Unknown search type',
    );
  });
});
