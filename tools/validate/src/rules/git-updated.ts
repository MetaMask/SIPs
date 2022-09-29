import Debug from "debug";
import { Root } from "mdast";
import simpleGit from "simple-git";
import { lintRule } from "unified-lint-rule";
import { EXIT, visit } from "unist-util-visit";
import YAML from "yaml";
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
          "The file is located in shallow repository. Can't get correct last edited time"
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
          let preamble;
          try {
            preamble = YAML.parse(node.value);
          } catch (e) {
            debug("Invalid preamble, silently dropping", e);
            return end();
          }
          if (!("updated" in preamble)) {
            debug('No "updated" preamble property, silently dropping');
            return end();
          }
          if (!isValidISO8601Date(preamble.updated)) {
            debug("updated property is not a valid date, silently dropping");
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
