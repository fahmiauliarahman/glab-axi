import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
}));

import { LABEL_HELP, labelCommand } from "../src/label.js";

describe("labelCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(labelCommand([])).resolves.toBe(LABEL_HELP);
  });

  it("renders label list output", async () => {
    glabJson.mockResolvedValueOnce([{ name: "priority:high" }]);

    const output = await labelCommand(["list"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("labels:");
    expect(output).toContain("priority:high");
    expect(glabJson).toHaveBeenCalledWith(
      ["label", "list", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(labelCommand(["unknown"])).rejects.toThrow(
      "Unknown label subcommand",
    );
  });
});
