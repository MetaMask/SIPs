import assert from "assert";
import { Context } from "../context.js";
import { AstNode, RuleDescriptor } from "../rule.js";
import { deepContains } from "../utils.js";

const COPYRIGHT_POSTAMBLE = [
  {
    type: "heading",
    depth: 2,
    children: [
      {
        type: "text",
        value: "Copyright",
      },
    ],
  },
  {
    type: "paragraph",
    children: [
      { type: "text", value: "Copyright and related rights waived via " },
      {
        type: "link",
        url: "../LICENSE",
        children: [{ type: "text", value: "CC0" }],
      },
    ],
  },
];

const descriptor: RuleDescriptor = {
  meta: {
    id: "copyright",
  },
  create: (context: Context) => ({
    root: (node: AstNode) => {
      assert(node.type === "root");

      if (
        node.children.length < 2 ||
        !deepContains(node.children.slice(-2), COPYRIGHT_POSTAMBLE)
      ) {
        return context.report({
          message: "No copyright postamble found or is malformed",
          node,
        });
      }
    },
  }),
};

export default descriptor;
