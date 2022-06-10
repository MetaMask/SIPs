import type { Content, Root } from "mdast";
import { Context } from "./context";

export type AstNode = Content | Root;

export type Validator = (node: AstNode) => void | Promise<void>;

export interface RuleDescriptor {
  meta: {
    id: string;
  };
  create: (context: Context) => Record<string, Validator>;
}
