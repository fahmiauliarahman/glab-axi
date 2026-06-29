import { renderHelp, renderOutput } from "./toon.js";

export async function homeCommand(): Promise<string> {
  return renderOutput([
    "glab-axi:\n  status: ready",
    renderHelp(["Run `glab-axi setup hooks` to install ambient context"]),
  ]);
}
