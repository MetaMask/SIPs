import assert from "assert";
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
import { EXIT, visit } from "unist-util-visit";
import { isParsed } from "../plugins/parseYaml.js";
import { isValidISO8601Date, isValidURL, lowercaseFirst } from "../utils.js";

const debug = Debug("validate:rule:preamble");

const HEADER_ORDER = [
  "sip",
  "title",
  "status",
  "discussions-to",
  "author",
  "created",
  "updated",
];
/**
 * Used for extracting the headers from preamble to check order.
 */
const HEADERS_REGEX = /^([a-z]+):.+$/m;

const EXTRACT_PATH_SIP = /sip-(?<sipNumber>[1-9][0-9]*)\.md$/;

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

const Preamble = refine(
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

assert(
  [...Object.keys(Preamble.schema)].every((header) =>
    HEADER_ORDER.includes(header)
  ),
  "Some headers don't have specified order"
);

const rule = lintRule<Root>("sip:preamble", (tree, file) => {
  let frontMatterFound = false;

  visit(tree, "yaml", (node) => {
    frontMatterFound = true;
    if (!isParsed(node)) {
      debug("Not a valid yaml, silently dropping");
      return EXIT;
    }

    const [error, preamble] = validate(node.data.parsed, Preamble);

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
      return EXIT;
    }
    assert(preamble !== undefined);
    debug(preamble);

    // Validation that is not based on the struct itself
    // More about the environment surrounding it

    // Validate header order
    const orderedHeaders = HEADERS_REGEX.exec(node.value)?.slice(1) ?? [];
    let orderIndex = 0;
    for (const header of orderedHeaders) {
      if (
        HEADER_ORDER[orderIndex] in orderedHeaders &&
        header !== HEADER_ORDER[orderIndex]
      ) {
        file.message(
          `Front-matter property \"${header}\" is not in proper order`,
          node
        );
        break;
      }
      orderIndex++;
    }

    // Validate that SIP number matches filename
    const match = file.basename?.match(EXTRACT_PATH_SIP);
    let extractedSip: number | undefined = undefined;
    if (match !== null && match !== undefined) {
      assert(match.groups?.sipNumber !== undefined);
      extractedSip = Number(match.groups?.sipNumber);
    }
    if (extractedSip === null || extractedSip !== preamble.sip) {
      file.message(
        'Front-matter property "sip" doesn\'t match the filename number',
        node
      );
    }

    return EXIT;
  });

  if (!frontMatterFound) {
    file.message("No front-matter found", tree);
  }
});

export default rule;
