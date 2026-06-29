import { execFile } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiError } from "axi-sdk-js";
import { glabExec, glabJson } from "../src/glab.js";
import type { RepoContext } from "../src/context.js";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

const mockedExecFile = vi.mocked(execFile);

type ExecFileCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void;

function mockExecFileResult(
  error: (Error & { code?: string | number }) | null,
  stdout: string,
  stderr: string,
) {
  mockedExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
    (callback as ExecFileCallback)(error, stdout, stderr);
    return {} as ReturnType<typeof execFile>;
  });
}

function mockExecFileEnoent() {
  mockedExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
    const error = new Error("spawn glab ENOENT") as Error & { code: string };
    error.code = "ENOENT";
    (callback as ExecFileCallback)(error, "", "");
    return {} as ReturnType<typeof execFile>;
  });
}

describe("glabExec", () => {
  beforeEach(() => {
    mockedExecFile.mockReset();
  });

  it("returns stdout on success", async () => {
    mockExecFileResult(null, "ok", "");

    await expect(glabExec(["version"])).resolves.toBe("ok");
  });

  it("maps ENOENT to install error", async () => {
    mockExecFileEnoent();

    await expect(glabExec(["version"])).rejects.toBeInstanceOf(AxiError);
    await expect(glabExec(["version"])).rejects.toMatchObject({
      code: "GLAB_NOT_INSTALLED",
    });
  });

  it("maps stderr errors", async () => {
    const error = new Error("exit 1") as Error & { code: number };
    error.code = 1;
    mockExecFileResult(error, "", "issue 42 not found");

    await expect(glabExec(["issue", "view", "42"])).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("glabJson", () => {
  beforeEach(() => {
    mockedExecFile.mockReset();
  });

  it("parses json output", async () => {
    mockExecFileResult(null, '{"id":1}', "");

    await expect(glabJson<{ id: number }>(["repo", "view"])).resolves.toEqual({
      id: 1,
    });
  });

  it("throws on invalid json", async () => {
    mockExecFileResult(null, "not json", "");

    await expect(glabJson(["repo", "view"])).rejects.toMatchObject({
      code: "UNKNOWN",
    });
  });

  it("applies repo context", async () => {
    mockExecFileResult(null, "[]", "");
    const ctx: RepoContext = {
      owner: "group",
      name: "project",
      nwo: "group/project",
      source: "flag",
    };

    await glabJson(["repo", "list"], ctx);

    expect(mockedExecFile.mock.calls[0]?.[1]).toEqual([
      "repo",
      "list",
      "--repo",
      "group/project",
    ]);
  });
});
