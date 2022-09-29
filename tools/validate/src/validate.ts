import remarkFrontMatter, { Root } from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { Plugin, Processor, unified } from "unified";
import { VFile, VFileCompatible } from "vfile";
import * as allRules from "./rules/index.js";

const SEVERITY_FATAL = 2;

const parser = unified()
  .use(remarkParse)
  .use(voidCompiler)
  .use(remarkGfm)
  .use(remarkFrontMatter, "yaml")
  .freeze();

export function validate(
  files: VFileCompatible[],
  rules: Plugin<any, Root, Root>[] = Object.values(allRules)
): Promise<VFile[]> {
  const withRules = parser().use(
    rules.map<[Plugin<any, Root, Root>, [number]]>((rule) => [
      rule,
      [SEVERITY_FATAL],
    ])
  );
  return Promise.all(files.map((file) => withRules.process(file)));
}

function voidCompiler(this: Processor) {
  const compiler = () => undefined;
  Object.assign(this, { Compiler: compiler });
}
