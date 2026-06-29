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
  RELEASE_HELP,
  RELEASE_CREATE_HELP,
  RELEASE_VIEW_HELP,
  releaseCommand,
} from "../src/release.js";

describe("releaseCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(releaseCommand([])).resolves.toBe(RELEASE_HELP);
  });

  it("renders release list output", async () => {
    glabJson.mockResolvedValueOnce([{ tag_name: "v1.2.3" }]);

    const output = await releaseCommand(["list"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("releases:");
    expect(output).toContain("v1.2.3");
    expect(glabJson).toHaveBeenCalledWith(
      ["release", "list", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders release view output", async () => {
    glabExec.mockResolvedValueOnce("release details\n");

    const output = await releaseCommand(["view", "v1.2.3"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("release details");
    expect(output).toContain("glab-axi release view --help");
    expect(glabExec).toHaveBeenCalledWith(
      ["release", "view", "v1.2.3"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders release create output", async () => {
    glabExec.mockResolvedValueOnce("created\n");

    const output = await releaseCommand(
      ["create", "v1.2.3", "--notes", "bugfix"],
      {
        owner: "group",
        name: "project",
        nwo: "group/project",
        source: "flag",
      },
    );

    expect(output).toContain("created");
    expect(output).toContain("glab-axi release create --help");
    expect(glabExec).toHaveBeenCalledWith(
      ["release", "create", "v1.2.3", "--notes", "bugfix"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("returns release view help", async () => {
    await expect(releaseCommand(["view", "--help"])).resolves.toBe(
      RELEASE_VIEW_HELP,
    );
  });

  it("returns release create help", async () => {
    await expect(releaseCommand(["create", "--help"])).resolves.toBe(
      RELEASE_CREATE_HELP,
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(releaseCommand(["unknown"])).rejects.toThrow(
      "Unknown release subcommand",
    );
  });
});
