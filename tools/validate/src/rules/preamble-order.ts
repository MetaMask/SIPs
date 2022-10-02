import assert from "assert";
import { Root } from "mdast";
import { lintRule } from "unified-lint-rule";
import { select } from "unist-util-select";
import { ParsedYaml } from "../plugins/parseYaml.js";
import { Preamble } from "./preamble-data.js";

const HEADER_ORDER = [
  "sip",
  "title",
  "status",
  "discussions-to",
  "author",
  "created",
  "updated",
];

assert(
  [...Object.keys(Preamble.schema)].every((header) =>
    HEADER_ORDER.includes(header)
  ),
  "Some headers don't have specified order"
);

/**
 * Used for extracting the headers from preamble to check order.
 */
const HEADERS_REGEX = /^([a-z]+):.+$/m;

const rule = lintRule<Root>("sip:preamble-order", (tree, file) => {
  const node = select("parsedYaml", tree) as ParsedYaml | null;
  if (!node) {
    return;
  }
  const orderedHeaders = HEADERS_REGEX.exec(node.value)?.slice(1) ?? [];
  let orderIndex = 0;
  for (const header of orderedHeaders) {
    if (
      HEADER_ORDER[orderIndex] in orderedHeaders &&
      header !== HEADER_ORDER[orderIndex]
    ) {
      file.message(
        `Front-matter property \"${header}\" is not in proper order`,
        node
      );
      break;
    }
    orderIndex++;
  }
});
export default rule;
