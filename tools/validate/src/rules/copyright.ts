import { Root } from "mdast";
import { lintRule } from "unified-lint-rule";
import { location } from "vfile-location";
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

const rule = lintRule<Root>("sip:copyright", (tree, file) => {
  if (
    tree.children.length < 2 ||
    !deepContains(tree.children.slice(-2), COPYRIGHT_POSTAMBLE)
  ) {
    const place = location(file);
    file.message(
      "No copyright postamble found or is malformed",
      place.toPoint(Math.max(file.value.length - 1, 0))
    );
  }
});

export default rule;
