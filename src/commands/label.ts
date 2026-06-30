import type { RepoContext } from "../context.js";
import { glabJson, glabExec } from "../glab.js";
import { AxiError } from "../errors.js";
import { getSuggestions } from "../suggestions.js";
import { getFlag } from "../args.js";
import {
  field,
  renderList,
  renderDetail,
  renderHelp,
  renderError,
  renderOutput,
  type FieldDef,
} from "../toon.js";
import { formatCountLine } from "../format.js";

export const LABEL_HELP = `usage: glab-axi label <subcommand> [flags]
subcommands[4]:
  list, create, edit, delete
flags{create}:
  --name <name> (required), --color <hex> (required), --description <text>
flags{edit}:
  --name <name> (required), --new-name <name>, --color <hex>, --description <text>
flags{delete}:
  --name <name> (required)
examples:
  glab-axi label list
  glab-axi label create --name bug --color "#FF0000"
  glab-axi label edit --name bug --color "#00FF00"
  glab-axi label delete --name bug`;

const listSchema: FieldDef[] = [
  field("name"),
  field("color"),
  field("description"),
];

async function listLabels(args: string[], ctx?: RepoContext): Promise<string> {
  const labels = await glabJson<Record<string, unknown>[]>(
    ["label", "list", "--output", "json"],
    ctx,
  );
  const isEmpty = labels.length === 0;
  const help = getSuggestions({ domain: "label", action: "list", isEmpty, repo: ctx });

  return renderOutput([
    formatCountLine({ count: labels.length }),
    renderList("labels", labels, listSchema),
    renderHelp(help),
  ]);
}

async function createLabel(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return LABEL_HELP;
  const name = getFlag(args, "--name");
  if (!name) throw new AxiError("--name is required", "VALIDATION_ERROR");
  const color = getFlag(args, "--color");
  if (!color) throw new AxiError("--color is required", "VALIDATION_ERROR");
  const description = getFlag(args, "--description");

  const glabArgs = ["label", "create", name, "--color", color];
  if (description) glabArgs.push("--description", description);

  await glabExec(glabArgs, ctx);

  const help = getSuggestions({ domain: "label", action: "create", repo: ctx });
  return renderOutput([
    renderDetail("label", { name, color, status: "created" }, [field("name"), field("color"), field("status")]),
    renderHelp(help),
  ]);
}

async function editLabel(args: string[], ctx?: RepoContext): Promise<string> {
  if (args.includes("--help") || args.includes("-h")) return LABEL_HELP;
  const name = getFlag(args, "--name");
  if (!name) throw new AxiError("--name is required", "VALIDATION_ERROR");

  const glabArgs = ["label", "edit", name];
  const newName = getFlag(args, "--new-name");
  if (newName) glabArgs.push("--new-name", newName);
  const color = getFlag(args, "--color");
  if (color) glabArgs.push("--color", color);
  const description = getFlag(args, "--description");
  if (description) glabArgs.push("--description", description);

  if (glabArgs.length > 3) {
    await glabExec(glabArgs, ctx);
  }

  const help = getSuggestions({ domain: "label", action: "edit", repo: ctx });
  return renderOutput([
    renderDetail("label", { name, status: "edited" }, [field("name"), field("status")]),
    renderHelp(help),
  ]);
}

async function deleteLabel(args: string[], ctx?: RepoContext): Promise<string> {
  const name = getFlag(args, "--name");
  if (!name) throw new AxiError("--name is required", "VALIDATION_ERROR");

  await glabExec(["label", "delete", name, "--yes"], ctx);

  return renderOutput([
    renderDetail("label", { name, status: "deleted" }, [field("name"), field("status")]),
  ]);
}

export async function labelCommand(
  args: string[],
  ctx?: RepoContext,
): Promise<string> {
  const sub = args[0];

  if (sub === "--help" || sub === undefined) return LABEL_HELP;

  switch (sub) {
    case "list":
      return listLabels(args, ctx);
    case "create":
      return createLabel(args, ctx);
    case "edit":
      return editLabel(args, ctx);
    case "delete":
      return deleteLabel(args, ctx);
    default:
      return renderError(`Unknown subcommand: ${sub}`, "VALIDATION_ERROR", [
        "Available subcommands: list, create, edit, delete",
      ]);
  }
}
