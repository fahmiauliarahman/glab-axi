import { beforeEach, describe, expect, it, vi } from "vitest";

const { main } = vi.hoisted(() => ({
  main: vi.fn(),
}));

vi.mock("../src/cli.js", () => ({
  main,
}));

describe("CLI entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    main.mockReset();
  });

  it("calls main when bin file is loaded", async () => {
    await import("../bin/glab-axi.js");

    expect(main).toHaveBeenCalledTimes(1);
  });
});
