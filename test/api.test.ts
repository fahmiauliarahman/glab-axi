import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabExec } = vi.hoisted(() => ({
  glabExec: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabExec,
}));

import { apiCommand, API_HELP } from "../src/api.js";

describe("apiCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns help by default", async () => {
    await expect(apiCommand([])).resolves.toBe(API_HELP);
  });

  it("renders JSON api output", async () => {
    glabExec.mockResolvedValueOnce('{"id":1,"name":"group"}');

    await expect(
      apiCommand(["user"], {
        owner: "group",
        name: "project",
        nwo: "group/project",
        source: "flag",
      }),
    ).resolves.toContain("id: 1");

    expect(glabExec).toHaveBeenCalledWith(
      ["api", "user"],
      expect.objectContaining({ nwo: "group/project" }),
    );
  });

  it("renders raw api output when response is not json", async () => {
    glabExec.mockResolvedValueOnce("plain text");

    await expect(apiCommand(["user"])).resolves.toContain("plain text");
  });
});
