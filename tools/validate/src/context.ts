import assert from "assert";
import { AstNode, RuleDescriptor } from "./rule.js";

export class ContextImpl implements Context {
  report(data: { message: string; node: AstNode }): void {
    const rule = this.currentRule;
    assert(rule !== undefined);
    this.reports.push({
      rule,
      message: data.message,
      node: data.node,
    });
  }

  currentRule: RuleDescriptor | undefined;

  reports: { rule: RuleDescriptor; message: string; node: AstNode }[] = [];
}

export interface Context {
  report(data: { message: string; node: AstNode }): void;
}
