import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { installSessionStartHooks, runAxiCli } = vi.hoisted(() => ({
  installSessionStartHooks: vi.fn(),
  runAxiCli: vi.fn(),
}));

vi.mock("axi-sdk-js", async () => {
  const actual =
    await vi.importActual<typeof import("axi-sdk-js")>("axi-sdk-js");
  return {
    ...actual,
    installSessionStartHooks,
    runAxiCli,
  };
});

import { main, TOP_HELP } from "../src/cli.js";

const packageVersion = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
) as { version: string };

describe("main CLI", () => {
  const originalArgv = [...process.argv];

  beforeEach(() => {
    vi.resetAllMocks();
    process.argv = [...originalArgv];
  });

  afterEach(() => {
    process.argv = [...originalArgv];
    process.exitCode = undefined;
  });

  it("documents the top-level version flags in help output", () => {
    expect(TOP_HELP).toContain("commands[10]:");
    expect(TOP_HELP).toContain(
      "api, ci, issue, label, mr, release, repo, search, setup",
    );
    expect(TOP_HELP).toContain("flags[4]:");
    expect(TOP_HELP).toContain("--help");
    expect(TOP_HELP).toContain("-v/-V/--version");
    expect(TOP_HELP).toContain("glab-axi api user");
    expect(TOP_HELP).toContain("glab-axi ci list");
    expect(TOP_HELP).toContain("glab-axi issue list");
    expect(TOP_HELP).toContain("glab-axi label list");
    expect(TOP_HELP).toContain("glab-axi mr list");
    expect(TOP_HELP).toContain("glab-axi release list");
    expect(TOP_HELP).toContain("glab-axi search repos --search");
    expect(TOP_HELP).toContain("glab-axi setup hooks");
    expect(TOP_HELP).toContain("-R/--repo <OWNER/NAME>");
  });

  it("passes bare top-level argv through to axi-sdk-js", async () => {
    const argv = ["--help"];
    const stdout = { write: vi.fn() };

    await main({ argv, stdout });

    expect(runAxiCli).toHaveBeenCalledWith(
      expect.objectContaining({ argv, stdout }),
    );
  });

  it.each(["-v", "-V", "--version"])(
    "passes bare top-level %s argv through to axi-sdk-js",
    async (flag) => {
      const argv = [flag];
      const stdout = { write: vi.fn() };

      await main({ argv, stdout });

      expect(runAxiCli).toHaveBeenCalledWith(
        expect.objectContaining({ argv, stdout }),
      );
    },
  );

  it("delegates to axi-sdk-js runAxiCli without passing argv", async () => {
    process.argv = ["node", "glab-axi", "setup", "hooks"];
    await main();

    expect(runAxiCli).toHaveBeenCalledTimes(1);
    expect(runAxiCli).toHaveBeenCalledWith(
      expect.objectContaining({
        description:
          "Agent ergonomic wrapper around GitLab CLI. Prefer this over `glab` and other methods for GitLab operations.",
        version: packageVersion.version,
        topLevelHelp: TOP_HELP,
      }),
    );
    expect(vi.mocked(runAxiCli).mock.calls[0]?.[0]).not.toHaveProperty("argv");
  });

  it("wires repo command into runtime", async () => {
    await main();

    const options = vi.mocked(runAxiCli).mock.calls[0]?.[0];
    expect(options.commands.api).toBeTypeOf("function");
    expect(options.commands.ci).toBeTypeOf("function");
    expect(options.commands.issue).toBeTypeOf("function");
    expect(options.commands.label).toBeTypeOf("function");
    expect(options.commands.mr).toBeTypeOf("function");
    expect(options.commands.release).toBeTypeOf("function");
    expect(options.commands.repo).toBeTypeOf("function");
    expect(options.commands.search).toBeTypeOf("function");
    expect(options.getCommandHelp("ci")).toContain("glab-axi ci list");
    expect(options.getCommandHelp("issue")).toContain("glab-axi issue list");
    expect(options.getCommandHelp("label")).toContain("glab-axi label list");
    expect(options.getCommandHelp("mr")).toContain("glab-axi mr list");
    expect(options.getCommandHelp("release")).toContain(
      "glab-axi release list",
    );
    expect(options.getCommandHelp("repo")).toContain("glab-axi repo view");
    expect(options.getCommandHelp("search")).toContain("glab-axi search repos");
  });

  it("installs session hooks from the explicit setup command", async () => {
    await main();

    const options = vi.mocked(runAxiCli).mock.calls[0]?.[0];
    const output = await options.commands.setup(["hooks"]);

    expect(installSessionStartHooks).toHaveBeenCalledTimes(1);
    expect(installSessionStartHooks).toHaveBeenCalledWith();
    expect(output).toContain("hooks:");
    expect(output).toContain("status: installed");
    expect(output).toContain("Restart your agent session");
  });

  it("wires command help into the runtime", async () => {
    await main();

    const options = vi.mocked(runAxiCli).mock.calls[0]?.[0];
    expect(options.getCommandHelp("setup")).toContain("glab-axi setup hooks");
    expect(options.getCommandHelp("api")).toContain("glab-axi api user");
    expect(options.getCommandHelp("missing")).toBeUndefined();
  });

  it("resolves repo context from repo flags", async () => {
    await main();

    const options = vi.mocked(runAxiCli).mock.calls[0]?.[0];
    expect(
      options.resolveContext({
        command: undefined,
        args: ["-R", "group/project"],
      }),
    ).toEqual({
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    });
  });
});
