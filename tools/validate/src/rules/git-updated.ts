import assert from "assert";
import Debug from "debug";
import simpleGit, { LogResult } from "simple-git";
import YAML from "yaml";
import { Context } from "../context.js";
import { AstNode, RuleDescriptor } from "../rule.js";

const debug = Debug("validate:rule:git-updated");

const descriptor: RuleDescriptor = {
  meta: {
    id: "git-updated",
  },
  create: (context: Context) => ({
    yaml: async (node: AstNode) => {
      assert(node.type === "yaml");
      let preamble;

      if (!context.path) {
        debug("Not working with real file");
        return;
      }
      try {
        preamble = YAML.parse(node.value);
      } catch (e) {
        debug("Failed to parse YAML", e);
        return;
      }
      if (!("updated" in preamble)) {
        debug('Header "updated" not found');
        return;
      }

      let date: LogResult<{ date: string }>;
      try {
        date = await simpleGit().log({
          file: context.path,
          maxCount: 1,
          format: { date: "%cs" },
        });
      } catch (e) {
        debug("Failed to execute git log", e);
        return;
      }
      if (date.latest === null) {
        debug("git log didn't return date");
        return;
      }

      const updatedDate = new Date(preamble.updated);
      debug("updated date", preamble.updated, updatedDate);
      const logDate = new Date(date.latest.date);
      debug("git log date", date.latest.date, logDate);
      if (logDate > updatedDate) {
        context.report({
          message:
            'The SIP has been updated in git later than the date in "updated" preamble header.',
          node,
        });
      }
    },
  }),
};
export default descriptor;
