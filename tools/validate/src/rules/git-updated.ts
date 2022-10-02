import Debug from "debug";
import { Root } from "mdast";
import simpleGit from "simple-git";
import { lintRule } from "unified-lint-rule";
import { EXIT, visit } from "unist-util-visit";
import { isParsed } from "../plugins/parseYaml.js";
import { isValidISO8601Date } from "../utils.js";
const debug = Debug("validate:rule:git-updated");

const rule = lintRule<Root>(
  "sip:git-updated",
  (tree, file) =>
    new Promise(async (end) => {
      const git = simpleGit(file.cwd);

      if (!(await git.checkIsRepo())) {
        file.info("The file is not in a git repository");
        return end();
      }
      if ((await git.revparse("--is-shallow-repository")) === "true") {
        file.info(
          "File is located in shallow repository. Can't get correct last edited time"
        );
        return end();
      }

      const gitDate = await git.log({
        format: { date: "%as" },
        file: file.path,
        maxCount: 1,
      });
      if (gitDate.latest === null) {
        file.info("File is not committed to git repository");
        return end();
      }

      visit(tree, "yaml", (node): typeof EXIT => {
        (async () => {
          if (!isParsed(node)) {
            debug("Invalid preamble, silently dropping");
            return end();
          }
          const preamble = node.data.parsed;
          if (!("updated" in preamble)) {
            debug('No "updated" preamble property, silently dropping');
            return end();
          }
          if (!isValidISO8601Date(preamble.updated)) {
            debug('"updated" property is not a valid date, silently dropping');
            return end();
          }
          if (new Date(preamble.updated) < new Date(gitDate.latest!.date)) {
            file.message(
              'The "updated" preamble property is older than last git updated time',
              node
            );
          }
          return end();
        })();

        return EXIT;
      });
    })
);

export default rule;
