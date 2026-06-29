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
  mrCommand,
  MR_CREATE_HELP,
  MR_HELP,
  MR_MERGE_HELP,
  MR_VIEW_HELP,
} from "../src/mr.js";

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

  it("renders merge request create passthrough output", async () => {
    glabExec.mockResolvedValueOnce("Created merge request !7");

    const output = await mrCommand(["create", "--title", "Ship it"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("Created merge request !7");
    expect(output).toContain("Use `glab-axi mr create --help`");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "create", "--title", "Ship it"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders merge request merge passthrough output", async () => {
    glabExec.mockResolvedValueOnce("Merged merge request !7");

    const output = await mrCommand(["merge", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("Merged merge request !7");
    expect(output).toContain("Use `glab-axi mr merge --help`");
    expect(glabExec).toHaveBeenCalledWith(
      ["mr", "merge", "7"],
      expect.objectContaining({ nwo: "group/project" }),
    );
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

  it("renders merge request view output", async () => {
    glabJson.mockResolvedValueOnce({ iid: 7, title: "Ship it" });

    const output = await mrCommand(["view", "7"], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("mr:");
    expect(output).toContain("Ship it");
    expect(glabJson).toHaveBeenCalledWith(
      ["mr", "view", "7", "--output", "json"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("returns merge request view help when asked", async () => {
    await expect(mrCommand(["view", "--help"])).resolves.toBe(MR_VIEW_HELP);
  });

  it("returns merge request create help when asked", async () => {
    await expect(mrCommand(["create", "--help"])).resolves.toBe(MR_CREATE_HELP);
  });

  it("returns merge request merge help when asked", async () => {
    await expect(mrCommand(["merge", "--help"])).resolves.toBe(MR_MERGE_HELP);
  });

  it("rejects unknown subcommands", async () => {
    await expect(mrCommand(["unknown"])).rejects.toThrow(
      "Unknown mr subcommand",
    );
  });
});
