import type { Root } from "mdast";
import remarkFrontMatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { Context } from "./context";
import { AstNode, RuleDescriptor, Validator } from "./rule";
import * as allRules from "./rules";
import { compile as compileSelector } from "./selector";
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkFrontMatter);

function parse(source: string | Buffer): Promise<Root> {
  return parser.process(source).then((f) => f.result as Root);
}

function* walk(node: AstNode): Generator<AstNode> {
  yield node;
  if ("children" in node) {
    for (const child of node.children) {
      yield* walk(child);
    }
  }
}

export async function validate(
  data: string | Buffer,
  rules: RuleDescriptor[] = Object.values(allRules)
) {
  const context = new Context();
  const validators = rules.reduce<Validator[]>((acc, rule) => {
    const selectors = Object.entries(rule.create(context)).map(
      ([selector, validator]) => {
        const filter = compileSelector(selector);
        return (node: AstNode) => {
          if (filter(node) === true) {
            return validator(node);
          }
        };
      }
    );
    acc.concat(selectors);
    return acc;
  }, []);

  const ast = await parse(data);

  for (const node of walk(ast)) {
    for (const validator of validators) {
      validator(node);
    }
  }
}
