import assert from "assert";
import type { Root } from "mdast";
import remarkFrontMatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { ContextImpl } from "./context.js";
import { Message } from "./reporter.js";
import { AstNode, RuleDescriptor, Validator } from "./rule.js";
import * as allRules from "./rules/index.js";
import { compile as compileSelector } from "./selector.js";

const parser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontMatter, "yaml");

function parse(source: string | Buffer): Root {
  return parser.parse(source);
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
  file: { data: string | Buffer; path?: string },
  rules: RuleDescriptor[] = Object.values(allRules)
): Promise<Message[]> {
  const context = new ContextImpl(file.path);

  const compiled = rules.reduce<[RuleDescriptor, Validator[]][]>(
    (acc, rule) => {
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
      acc.push([rule, selectors]);
      return acc;
    },
    []
  );

  const ast = parse(file.data);

  for (const node of walk(ast)) {
    for (const [rule, validators] of compiled) {
      context.currentRule = rule;
      // TODO(ritave): Promise.all on all validators at the same time
      await Promise.all(validators.map((validator) => validator(node)));
      context.currentRule = undefined;
    }
  }

  return context.reports.map(({ rule, message, node }) => {
    assert(node.position !== undefined);
    return {
      ruleId: rule.meta.id,
      message,
      line: node.position?.end.line,
      column: node.position?.end.column,
    };
  });
}
