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
  repoCommand,
  REPO_HELP,
  REPO_CREATE_HELP,
  REPO_LIST_HELP,
  REPO_SEARCH_HELP,
  REPO_VIEW_HELP,
} from "../src/repo.js";

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
    await expect(repoCommand(["list", "--help"])).resolves.toBe(REPO_LIST_HELP);
  });

  it("returns view help on demand", async () => {
    await expect(repoCommand(["view", "--help"])).resolves.toBe(REPO_VIEW_HELP);
  });

  it("returns create help on demand", async () => {
    await expect(repoCommand(["create", "--help"])).resolves.toBe(
      REPO_CREATE_HELP,
    );
  });

  it.each(["search", "find", "lookup"])(
    "returns %s help on demand",
    async (subcommand) => {
      await expect(repoCommand([subcommand, "--help"])).resolves.toBe(
        REPO_SEARCH_HELP,
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

    expect(output).toContain("project: group/project");
    expect(output).toContain('web: "https://gitlab.com/group/project"');
    expect(output).toContain("description: Project summary");
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

    expect(output).toContain("repos:");
    expect(output).toContain("group/project-1");
    expect(output).toContain("group/project-2");
    expect(output).toContain("Use `glab-axi repo list --help`");
    expect(glabJson).toHaveBeenCalledWith(
      ["repo", "list", "--output", "json"],
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
    expect(output).toContain("glab-axi repo create --help");
    expect(glabExec).toHaveBeenCalledWith(
      ["repo", "create", "my-project", "--visibility", "public"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(repoCommand(["unknown"])).rejects.toThrow(
      "Unknown repo subcommand",
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

      expect(output).toContain("repos:");
      expect(output).toContain("group/project");
      expect(glabJson).toHaveBeenCalledWith(
        ["repo", "search", "--output", "json", "--search", "cli tool"],
        expect.objectContaining({ nwo: "group/project" }),
      );
    },
  );
});
