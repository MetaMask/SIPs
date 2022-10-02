import Debug from "debug";
import { Root } from "mdast";
import {
  enums,
  number,
  object,
  optional,
  refine,
  string,
  Struct,
  validate,
} from "superstruct";
import { lintRule } from "unified-lint-rule";
import { select } from "unist-util-select";
import { ParsedYaml } from "../plugins/parseYaml.js";
import { isValidISO8601Date, isValidURL, lowercaseFirst } from "../utils.js";

const debug = Debug("validate:rule:preamble");

const url = (protocols?: string[]) =>
  refine(
    string(),
    "url",
    (value) =>
      isValidURL(value, protocols) || `not a valid ${protocols?.join("/")} url`
  );
const date = () =>
  refine(
    string(),
    "date",
    (value) => isValidISO8601Date(value) || "not a valid iso-8601 date"
  );
const positive = (struct: Struct<number, null>) =>
  refine(struct, "positive", (value) => value > 0 || "not a positive number");
const integer = () =>
  refine(
    number(),
    "integer",
    (value) => Number.isSafeInteger(value) || "not an integer"
  );

const GITHUB_USERNAME = String.raw`[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}`;
const EMAIL = String.raw`.+@.+`;
const AUTHOR = new RegExp(
  String.raw`^\w[.\w\s]*(?: (?:\<${EMAIL}\>(?: \((\@${GITHUB_USERNAME})\))?)|\((\@${GITHUB_USERNAME})\))?$`
);
const author = () =>
  refine(string(), "author", (value) => {
    const authors: string[] = value.split(",");
    let hasGithub = false;
    for (const author of authors) {
      const match = author.trim().match(AUTHOR);
      if (match === null) {
        return "is malformed";
      }
      if (match[2] !== undefined) {
        hasGithub = true;
      }
    }
    return hasGithub || "doesn't have at least one GitHub account";
  });

export const Preamble = refine(
  object({
    sip: positive(integer()),
    title: string(),
    status: enums([
      "Draft",
      "Review",
      "Implementation",
      "Final",
      "Withdrawn",
      "Living",
    ]),
    "discussions-to": optional(url(["http", "https"])),
    author: author(),
    created: date(),
    updated: optional(date()),
  }),
  "preamble",
  (value) => {
    const errors = [];

    if (
      value.updated !== undefined &&
      new Date(value.updated) < new Date(value.created)
    ) {
      errors.push('property "updated" is earlier than "created"');
    }

    if (value.status === "Living" && value.updated === undefined) {
      errors.push(
        'has status of "Living" but doesn\'t have "updated" preamble header'
      );
    }
    return errors.length === 0 || errors;
  }
);

const rule = lintRule<Root>("sip:preamble-data", (tree, file) => {
  const node = select("parsedYaml", tree) as ParsedYaml | null;
  if (!node) {
    return;
  }
  const [error] = validate(node.data.parsed, Preamble);

  if (error !== undefined) {
    const failures = error.failures();
    debug(failures);
    failures.forEach((failure) => {
      const prop = failure.path.at(-1);
      let msg;
      if (prop === undefined) {
        msg = `Front-matter ${lowercaseFirst(failure.message)}`;
      } else {
        msg = `Front-matter property "${prop}" ${lowercaseFirst(
          failure.message
        )}`;
      }
      file.message(msg, node);
    });
  }
});

export default rule;
