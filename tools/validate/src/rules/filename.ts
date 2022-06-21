import path from "path";
import { Context } from "../context.js";
import { AstNode, RuleDescriptor } from "../rule.js";

const SIP_FILENAME = /^sip-[1-9][0-9]*\.md$/;

const descriptor: RuleDescriptor = {
  meta: {
    id: "filename",
  },
  create: (context: Context) => ({
    root: (node: AstNode) => {
      if (
        context.path !== undefined &&
        !SIP_FILENAME.test(path.basename(context.path))
      ) {
        context.report({
          message: `File \"${context.path}\" doesn't have a filename in "sip-N.md" format`,
          node,
        });
      }
    },
  }),
};
export default descriptor;
