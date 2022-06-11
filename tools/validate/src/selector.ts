import { AstNode } from "./rule.js";

export function compile(test: string): (node: AstNode) => boolean {
  if (test === "*") {
    return () => true;
  }
  return (node) => node.type === test;
}
