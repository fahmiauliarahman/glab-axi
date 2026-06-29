import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
}));

import { RELEASE_HELP, releaseCommand } from "../src/release.js";

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

  it("rejects unknown subcommands", async () => {
    await expect(releaseCommand(["unknown"])).rejects.toThrow(
      "Unknown release subcommand",
    );
  });
});
