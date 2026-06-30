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

import { repoCommand, REPO_HELP } from "../src/commands/repo.js";

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

  it("returns list help on demand", async () => {
    await expect(repoCommand(["list", "--help"])).resolves.toBe(REPO_HELP);
  });

  it("returns view help on demand", async () => {
    await expect(repoCommand(["view", "--help"])).resolves.toBe(REPO_HELP);
  });

  it("returns create help on demand", async () => {
    await expect(repoCommand(["create", "--help"])).resolves.toBe(REPO_HELP);
  });

  it.each(["search", "find", "lookup"])(
    "returns %s help on demand",
    async (subcommand) => {
      await expect(repoCommand([subcommand, "--help"])).resolves.toBe(
        REPO_HELP,
      );
    },
  );

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

    expect(output).toContain("name: group/project");
    expect(output).toContain("https://gitlab.com/group/project");
    expect(output).toContain("Project summary");
    expect(glabJson).toHaveBeenCalledWith(
      ["repo", "view", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders repo list output", async () => {
    glabJson.mockResolvedValueOnce([
      {
        path_with_namespace: "group/project-1",
        web_url: "https://gitlab.com/group/project-1",
      },
      {
        path_with_namespace: "group/project-2",
        web_url: "https://gitlab.com/group/project-2",
      },
    ]);

    const output = await repoCommand(["list"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("repos[");
    expect(output).toContain("group/project-1");
    expect(output).toContain("group/project-2");
    expect(glabJson).toHaveBeenCalledWith(
      ["repo", "list", "--output", "json", "--per-page", "30"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders repo create output", async () => {
    glabExec.mockResolvedValueOnce("created project\n");

    const output = await repoCommand(
      ["create", "my-project", "--visibility", "public"],
      {
        owner: "group",
        name: "project",
        nwo: "group/project",
        source: "flag",
      },
    );

    expect(output).toContain("created project");
    expect(glabExec).toHaveBeenCalledWith(
      ["repo", "create", "my-project", "--visibility", "public"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(repoCommand(["unknown"])).resolves.toContain(
      'error: "Unknown subcommand',
    );
  });

  it.each(["search", "find", "lookup"])(
    "routes %s to repo search",
    async (subcommand) => {
      glabJson.mockResolvedValueOnce([
        {
          path_with_namespace: "group/project",
          web_url: "https://gitlab.com/group/project",
          description: "Project summary",
        },
      ]);

      const output = await repoCommand([subcommand, "--search", "cli tool"], {
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
    },
  );
});
