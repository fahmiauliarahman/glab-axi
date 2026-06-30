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

import { RELEASE_HELP, releaseCommand } from "../src/commands/release.js";

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

    expect(output).toContain("releases[");
    expect(output).toContain("v1.2.3");
    expect(glabJson).toHaveBeenCalledWith(
      ["release", "list", "--output", "json", "--per-page", "30"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders release view output", async () => {
    glabJson.mockResolvedValueOnce({
      tag_name: "v1.2.3",
      name: "Release v1.2.3",
    });

    const output = await releaseCommand(["view", "v1.2.3"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("v1.2.3");
    expect(glabJson).toHaveBeenCalledWith(
      ["release", "view", "v1.2.3", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders release create output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await releaseCommand(
      ["create", "v1.2.3", "--notes", "bugfix"],
      {
        owner: "group",
        name: "project",
        nwo: "group/project",
        source: "flag",
      },
    );

    expect(output).toContain("status: created");
    expect(glabExec).toHaveBeenCalledWith(
      ["release", "create", "v1.2.3", "--notes", "bugfix"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("returns release view help", async () => {
    await expect(releaseCommand(["view", "--help"])).resolves.toBe(
      RELEASE_HELP,
    );
  });

  it("renders release download passthrough output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await releaseCommand(["download", "v1.2.3"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["release", "download", "v1.2.3"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders release upload passthrough output", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await releaseCommand(["upload", "v1.2.3", "binary.tar.gz"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("status: ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["release", "upload", "v1.2.3", "binary.tar.gz"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("returns release download help", async () => {
    await expect(releaseCommand(["download", "--help"])).resolves.toBe(RELEASE_HELP);
  });

  it("returns release upload help", async () => {
    await expect(releaseCommand(["upload", "--help"])).resolves.toBe(RELEASE_HELP);
  });

  it("returns release create help", async () => {
    await expect(releaseCommand(["create", "--help"])).resolves.toBe(
      RELEASE_HELP,
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(releaseCommand(["unknown"])).resolves.toContain(
      'error: "Unknown subcommand',
    );
  });
});
