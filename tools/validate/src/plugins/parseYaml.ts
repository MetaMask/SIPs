import assert from "assert";
import Debug from "debug";
import { Root, YAML as MDYAML } from "mdast";
import { CONTINUE, visit } from "unist-util-visit";
import { VFile } from "vfile";
import YAML from "yaml";

const debug = Debug("validate:plugin:parse-yaml");

export interface ParsedYaml extends MDYAML {
  data: { parsed: any } | { error: Error };
}

export interface ParsedResultYaml extends ParsedYaml {
  data: { parsed: any };
}

export function isParsedNode(node: MDYAML): node is ParsedYaml {
  return (
    "data" in node &&
    typeof node.data === "object" &&
    ("parsed" in node.data || "error" in node.data)
  );
}

export function isParsed(node: MDYAML): node is ParsedResultYaml {
  return isParsedNode(node) && "parsed" in node.data;
}

export default function parseYaml() {
  return (tree: Root, file: VFile) => {
    visit(tree, "yaml", (node) => {
      let data;
      try {
        data = { parsed: YAML.parse(node.value, { prettyErrors: true }) };
      } catch (error) {
        debug(error);
        assert(error instanceof Error);
        file.message("Front-matter is not valid YAML", node, "sip:yaml");
        data = { error };
      }
      (node as ParsedYaml).data = data;
      return CONTINUE;
    });
  };
}
