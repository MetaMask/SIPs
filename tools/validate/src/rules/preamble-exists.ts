import { Root } from "mdast";
import { lintRule } from "unified-lint-rule";
import { selectAll } from "unist-util-select";

const rule = lintRule<Root>("sip:preamble-exists", (tree, file) => {
  const nodes = selectAll("parsedYaml", tree);

  if (!nodes.length) {
    file.message("No preamble found", tree);
  } else if (nodes.length > 1) {
    nodes.slice(1).forEach((node) => file.message("Too many preambles", node));
  }
});

export default rule;
