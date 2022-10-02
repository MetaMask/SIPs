import Debug from "debug";
import { Root } from "mdast";
import simpleGit from "simple-git";
import { is, pick } from "superstruct";
import { lintRule } from "unified-lint-rule";
import { select } from "unist-util-select";
import { ParsedYaml } from "../plugins/parseYaml.js";
import { Preamble } from "./preamble-data.js";
const debug = Debug("validate:rule:git-updated");

const Updated = pick(Preamble, ["updated"]);

const rule = lintRule<Root>("sip:git-updated", async (tree, file) => {
  const node = select("parsedYaml", tree) as ParsedYaml | null;
  if (!node) {
    return;
  }
  if (!is(node.data.parsed, Updated)) {
    debug("Malformed preamble, silently dropping");
    return;
  }
  const updated = node.data.parsed.updated;
  if (updated === undefined) {
    return;
  }

  const git = simpleGit(file.cwd);

  if (!(await git.checkIsRepo())) {
    file.info("The file is not in a git repository");
    return;
  }
  if ((await git.revparse("--is-shallow-repository")) === "true") {
    file.info(
      "File is located in shallow repository. Can't get correct last edited time"
    );
    return;
  }
  const result = await git.log({
    format: { date: "%as" },
    file: file.path,
    maxCount: 1,
  });
  const gitDate = result.latest;
  if (gitDate === null) {
    file.info("File is not committed to git repository");
    return;
  }

  if (new Date(updated) < new Date(gitDate.date)) {
    file.message(
      'The "updated" preamble property is older than last git updated time',
      node
    );
  }
});

export default rule;
