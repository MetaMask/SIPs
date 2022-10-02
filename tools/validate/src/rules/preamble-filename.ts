import assert from "assert";
import Debug from "debug";
import { Root } from "mdast";
import { is, pick } from "superstruct";
import { lintRule } from "unified-lint-rule";
import { select } from "unist-util-select";
import { ParsedYaml } from "../plugins/parseYaml.js";
import { Preamble } from "./preamble-data.js";

const debug = Debug("validate:rule:preamble-filename");

const EXTRACT_PATH_SIP = /sip-(?<sipNumber>[1-9][0-9]*)\.md$/;

const Sip = pick(Preamble, ["sip"]);

const rule = lintRule<Root>("sip:preamble-filename", (tree, file) => {
  const node = select("parsedYaml", tree) as ParsedYaml | null;
  if (!node) {
    return;
  }
  if (!is(node.data.parsed, Sip)) {
    debug("Malformed preamble, silently dropping");
    return;
  }

  const match = file.basename?.match(EXTRACT_PATH_SIP);
  let extractedSip: number | undefined = undefined;
  if (match !== null && match !== undefined) {
    assert(match.groups?.sipNumber !== undefined);
    extractedSip = Number(match.groups?.sipNumber);
  }

  if (extractedSip === null || extractedSip !== node.data.parsed.sip) {
    file.message(
      'Front-matter property "sip" doesn\'t match the filename number',
      node
    );
  }
});

export default rule;
