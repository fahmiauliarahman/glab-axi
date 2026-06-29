import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { glabJson } = vi.hoisted(() => ({
  glabJson: vi.fn(),
}));

vi.mock("../src/glab.js", () => ({
  glabJson,
}));

import { homeCommand } from "../src/home.js";

describe("homeCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders project and activity counts", async () => {
    glabJson.mockResolvedValueOnce({
      path_with_namespace: "group/project",
      web_url: "https://gitlab.com/group/project",
    });
    glabJson.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    glabJson.mockResolvedValueOnce([{ id: 10 }]);

    const output = await homeCommand([], {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });

    expect(output).toContain("project: group/project");
    expect(output).toContain('web: "https://gitlab.com/group/project"');
    expect(output).toContain("issues:");
    expect(output).toContain("count: 2");
    expect(output).toContain("mrs:");
    expect(output).toContain("count: 1");
  });
});
