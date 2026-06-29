import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { repoCommand, searchCommand } = vi.hoisted(() => ({
  repoCommand: vi.fn(),
  searchCommand: vi.fn(),
}));

vi.mock("../src/repo.js", () => ({
  REPO_HELP: "repo help",
  repoCommand,
}));

vi.mock("../src/search.js", () => ({
  SEARCH_HELP: "search help",
  searchCommand,
}));

import { projectCommand, PROJECT_HELP } from "../src/project.js";

describe("projectCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(projectCommand([])).resolves.toBe(PROJECT_HELP);
  });

  it("routes view to repo view", async () => {
    repoCommand.mockResolvedValueOnce("repo view output");

    await expect(
      projectCommand(["view"], { nwo: "group/project" }),
    ).resolves.toBe("repo view output");

    expect(repoCommand).toHaveBeenCalledWith(
      ["view"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("routes search to search repos", async () => {
    searchCommand.mockResolvedValueOnce("search output");

    await expect(
      projectCommand(["search", "--search", "cli tool"], {
        nwo: "group/project",
      }),
    ).resolves.toBe("search output");

    expect(searchCommand).toHaveBeenCalledWith(
      ["repos", "--search", "cli tool"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(projectCommand(["unknown"])).rejects.toThrow(
      "Unknown project subcommand",
    );
  });
});
