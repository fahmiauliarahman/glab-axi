import { encode } from "@toon-format/toon";

export function renderHelp(lines: string[]): string {
  if (lines.length === 0) {
    return "";
  }

  return `help[${lines.length}]:\n${lines.map((line) => `  ${line}`).join("\n")}`;
}

export function renderOutput(blocks: string[]): string {
  return blocks.filter(Boolean).join("\n");
}

export function renderKeyValueBlock(label: string, value: string): string {
  return encode({ [label]: value });
}
