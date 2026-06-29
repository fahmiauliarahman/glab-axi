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

import { LABEL_CREATE_HELP, LABEL_HELP, labelCommand } from "../src/label.js";

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

  it("renders label create passthrough output", async () => {
    glabExec.mockResolvedValueOnce("Created label bug");

    const output = await labelCommand(
      ["create", "--name", "bug", "--color", "#FF0000"],
      {
        owner: "group",
        name: "project",
        nwo: "group/project",
        source: "flag",
      },
    );

    expect(output).toContain("Created label bug");
    expect(output).toContain("Use `glab-axi label create --help`");
    expect(glabExec).toHaveBeenCalledWith(
      ["label", "create", "--name", "bug", "--color", "#FF0000"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("returns label create help when asked", async () => {
    await expect(labelCommand(["create", "--help"])).resolves.toBe(
      LABEL_CREATE_HELP,
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(labelCommand(["unknown"])).rejects.toThrow(
      "Unknown label subcommand",
    );
  });
});
