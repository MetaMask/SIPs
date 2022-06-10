import { AstNode } from "./rule";

export class Context {
  report(data: { message: string; node: AstNode }): void {}
}
