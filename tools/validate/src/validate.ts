import remarkFrontMatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkLintHardBreakSpaces from "remark-lint-hard-break-spaces";
import remarkLintNoDuplicateDefinitions from "remark-lint-no-duplicate-definitions";
import remarkLintNoHeadingContentIndent from "remark-lint-no-heading-content-indent";
import remarkLintNoInlinePadding from "remark-lint-no-inline-padding";
import remarkLintNoShortcutReferenceImage from "remark-lint-no-shortcut-reference-image";
import remarkLintNoShortcutReferenceLink from "remark-lint-no-shortcut-reference-link";
import remarkLintNoUndefinedReferences from "remark-lint-no-undefined-references";
import remarkLintNoUnusedDefinitions from "remark-lint-no-unused-definitions";
import remarkParse from "remark-parse";
import { Processor, unified } from "unified";
import { VFile, VFileCompatible } from "vfile";
import parseYaml from "./plugins/parseYaml.js";
import * as sipRules from "./rules/index.js";

const parser = unified()
  .use(remarkParse)
  .use(voidCompiler)
  .use(remarkGfm)
  .use(remarkFrontMatter, "yaml")
  .use(parseYaml)
  .use({
    plugins: [
      remarkLintHardBreakSpaces,
      remarkLintNoDuplicateDefinitions,
      remarkLintNoHeadingContentIndent,
      remarkLintNoInlinePadding,
      remarkLintNoShortcutReferenceImage,
      remarkLintNoShortcutReferenceLink,
      remarkLintNoUndefinedReferences,
      [remarkLintNoUnusedDefinitions, { allow: [/^!/] }],
    ],
  }) // like remark-preset-lint-recommended but only for critical mistakes
  .use(Object.values(sipRules))
  .freeze();

export function validate(files: VFileCompatible[]): Promise<VFile[]> {
  return Promise.all(files.map((file) => parser.process(file)));
}

function voidCompiler(this: Processor) {
  const compiler = () => undefined;
  Object.assign(this, { Compiler: compiler });
}
