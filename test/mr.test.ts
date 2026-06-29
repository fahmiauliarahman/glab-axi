import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
}));

import { mrCommand, MR_HELP } from "../src/mr.js";

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

  it("renders merge request list output", async () => {
    glabJson.mockResolvedValueOnce([{ iid: 7, title: "Ship it" }]);

    const output = await mrCommand(["list"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("mrs:");
    expect(output).toContain("Ship it");
    expect(glabJson).toHaveBeenCalledWith(
      ["mr", "list", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(mrCommand(["unknown"])).rejects.toThrow(
      "Unknown mr subcommand",
    );
  });
});
