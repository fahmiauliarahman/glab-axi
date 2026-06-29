import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createSkillMarkdown,
  extractCommandsBlock,
  HERMES_CATEGORY,
  HERMES_TAGS,
  SKILL_AUTHOR,
  SKILL_DESCRIPTION,
} from "../src/skill.js";

describe("createSkillMarkdown", () => {
  it("matches committed skills/glab-axi/SKILL.md", () => {
    const committed = readFileSync(
      new URL("../skills/glab-axi/SKILL.md", import.meta.url),
      "utf8",
    );
    expect(committed).toBe(createSkillMarkdown());
  });

  it("starts with valid frontmatter and is not user-invocable", () => {
    const markdown = createSkillMarkdown();
    expect(markdown).toContain("---\nname: glab-axi\n");
    expect(markdown).toContain(
      `description: ${JSON.stringify(SKILL_DESCRIPTION)}`,
    );
    expect(markdown).toContain("user-invocable: false");
    expect(markdown).toContain(`author: ${SKILL_AUTHOR}`);
    expect(markdown).toContain(
      "metadata:\n  hermes:\n    tags: [gitlab, git, ci, merge-requests, releases]\n    category: devops",
    );
    expect(HERMES_TAGS).toEqual([
      "gitlab",
      "git",
      "ci",
      "merge-requests",
      "releases",
    ]);
    expect(HERMES_CATEGORY).toBe("devops");
  });

  it("teaches npx invocation and gitlab auth", () => {
    const markdown = createSkillMarkdown();
    expect(markdown).toContain("npx -y glab-axi");
    expect(markdown).toContain("glab auth login");
  });

  it("documents update and setup hooks", () => {
    const markdown = createSkillMarkdown();
    expect(markdown).toContain("glab-axi update --check");
    expect(markdown).toContain("glab-axi setup hooks");
  });
});

describe("extractCommandsBlock", () => {
  it("pulls commands list from top-level help", () => {
    const block = extractCommandsBlock();
    expect(block).toMatch(/^commands\[\d+\]:\n/);
    expect(block).toContain("issue");
    expect(block).toContain("setup");
  });
});
