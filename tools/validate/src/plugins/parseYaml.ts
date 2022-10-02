import assert from "assert";
import Debug from "debug";
import { Literal, Root } from "mdast";
import { CONTINUE, visit } from "unist-util-visit";
import { VFile } from "vfile";
import YAML from "yaml";

const debug = Debug("validate:plugin:parse-yaml");

declare module "mdast" {
  interface FrontmatterContentMap {
    parsedYaml: ParsedYaml;
  }
}

export interface ParsedYaml extends Literal {
  type: "parsedYaml";
  data: { parsed: unknown };
}

export default function parseYaml() {
  return (tree: Root, file: VFile) => {
    visit(tree, "yaml", (node) => {
      try {
        const parsed = YAML.parse(node.value, { prettyErrors: true });
        assert(node.data === undefined);
        Object.assign(node, { data: { parsed }, type: "parsedYaml" });
      } catch (error) {
        debug(error);
        assert(error instanceof Error);
        file.message("Front-matter is not valid YAML", node, "sip:yaml");
      }

      return CONTINUE;
    });
  };
}
