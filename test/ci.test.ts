import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabExec, glabJson } = vi.hoisted(() => ({
  glabExec: vi.fn(),
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabExec,
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

  it("runs ci pipelines", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await ciCommand(["run", "--web"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("pipeline_run:");
    expect(output).toContain("ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["ci", "run", "--web"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("triggers ci pipelines", async () => {
    glabExec.mockResolvedValueOnce("");

    const output = await ciCommand(["run-trig", "-t", "xxxx"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("pipeline_trigger:");
    expect(output).toContain("ok");
    expect(glabExec).toHaveBeenCalledWith(
      ["ci", "run-trig", "-t", "xxxx"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("rejects unknown subcommands", async () => {
    await expect(ciCommand(["unknown"])).rejects.toThrow(
      "Unknown ci subcommand",
    );
  });
});
