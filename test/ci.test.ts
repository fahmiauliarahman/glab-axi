import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
}));

import { ciCommand, CI_HELP } from "../src/ci.js";

describe("ciCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(ciCommand([])).resolves.toBe(CI_HELP);
  });

  it("renders ci list output", async () => {
    glabJson.mockResolvedValueOnce([{ id: 9, status: "success" }]);

    const output = await ciCommand(["list"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("pipelines:");
    expect(output).toContain("success");
    expect(glabJson).toHaveBeenCalledWith(
      ["ci", "list", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders ci get output", async () => {
    glabJson.mockResolvedValueOnce({
      id: 9,
      status: "success",
      ref: "main",
    });

    const output = await ciCommand(["get", "--pipeline-id", "9"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("pipeline:");
    expect(output).toContain("success");
    expect(glabJson).toHaveBeenCalledWith(
      ["ci", "get", "--output", "json", "--pipeline-id", "9"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders ci status output", async () => {
    glabJson.mockResolvedValueOnce({
      id: 9,
      status: "success",
      ref: "main",
    });

    const output = await ciCommand(["status", "--branch", "main"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("pipeline:");
    expect(output).toContain("success");
    expect(glabJson).toHaveBeenCalledWith(
      ["ci", "status", "--output", "json", "--branch", "main"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(ciCommand(["unknown"])).rejects.toThrow(
      "Unknown ci subcommand",
    );
  });
});
