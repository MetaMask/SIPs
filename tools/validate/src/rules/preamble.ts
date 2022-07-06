import assert from "assert";
import Debug from "debug";
import { URL } from "url";
import YAML from "yaml";
import { Context } from "../context.js";
import { AstNode, RuleDescriptor } from "../rule.js";

const debug = Debug("validate:rule:preamble");

const HEADER_TYPES = new Map([
  ["sip", "number"],
  ["title", "string"],
  ["status", "string"],
  ["discussions-to", "string"],
  ["author", "string"],
  ["created", "string"],
  ["updated", "string"],
]);

const HEADER_ORDER = [
  "sip",
  "title",
  "status",
  "discussions-to",
  "category",
  "author",
  "created",
  "updated",
];
const HEADER_REQUIRED = new Set([
  "sip",
  "title",
  "status",
  "category",
  "author",
  "created",
]);
const HEADER_OPTIONAL = new Set(["discussions-to", "updated"]);
const HEADER_ALL = new Set([
  ...HEADER_REQUIRED.values(),
  ...HEADER_OPTIONAL.values(),
]);
const HEADER_DATES = new Set(["created", "updated"]);
const STATUES = new Set(["Draft", "Review", "Final", "Withdrawn", "Living"]);
const CATEGORIES = new Set(["Core", "Blockchain", "Meta"]);
const ISO8601 = /^\d\d\d\d\-\d\d\-\d\d$/;
const HEADERS_REGEX = /^([a-z]+):.+$/m;

const GITHUB_USERNAME = String.raw`[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}`;
const EMAIL = String.raw`.+@.+`;
const AUTHOR = new RegExp(
  String.raw`^\w[.\w\s]*(?: (?:\<${EMAIL}\>(?: (\(\@${GITHUB_USERNAME}\)))?)|(\(\@${GITHUB_USERNAME}\)))?$`
);

const EXTRACT_PATH_SIP = /sip-(?<sipNumber>[1-9][0-9]*)\.md$/;

function isValidDate(data: string): boolean {
  const result = data.match(ISO8601);
  if (result === null) {
    return false;
  }
  const date = new Date(data);
  const now = new Date();
  return date <= now;
}

interface Preamble {
  sip?: number;
  title?: string;
  status?: string;
  "discussions-to"?: string;
  category?: string;
  author?: string;
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

function assertIsPreamble(preamble: unknown): asserts preamble is Preamble {
  if (typeof preamble !== "object" || preamble === null) {
    throw new Error('Preamble is not of type "object"');
  }
  Object.entries(preamble).forEach(([header, value]) => {
    if (HEADER_TYPES.has(header) && typeof value !== HEADER_TYPES.get(header)) {
      throw new Error(
        `Preamble header \"${header}\" has wrong type. Has \"${typeof value}\", should be \"${HEADER_TYPES.get(
          header
        )}\"`
      );
    }
  });
}

function isValidURL(url: string, protocols?: string[]): boolean {
  try {
    const parsed = new URL(url);
    return protocols === undefined
      ? true
      : protocols.includes(parsed.protocol.slice(0, -1)); // remove ':' at end
  } catch (e) {
    debug("Failed to validate URL", e);
    return false;
  }
}

const descriptor: RuleDescriptor = {
  meta: {
    id: "preamble",
  },
  create: (context: Context) => ({
    root: (node: AstNode) => {
      assert(node.type === "root");
      if (node.children.length < 1 || node.children[0].type !== "yaml") {
        return context.report({ message: "Preamble not found", node });
      }
      node = node.children[0];
      assert(node.type === "yaml");
      let preamble: Preamble;
      try {
        preamble = YAML.parse(node.value);
        assertIsPreamble(preamble);
      } catch (e) {
        debug("Front-matter YAML parse error", e);
        return context.report({
          message: "Preamble is not proper YAML",
          node,
        });
      }
      debug(preamble);

      // Validate all required headers
      const headers = new Set(Object.keys(preamble));
      HEADER_REQUIRED.forEach((required) => {
        if (!headers.has(required)) {
          context.report({
            message: `Preamble required header \"${required}\" is missing from preamble.`,
            node,
          });
        }
      });

      // Validate only required and optional headers
      headers.forEach((header) => {
        if (!HEADER_ALL.has(header)) {
          context.report({
            message: `Preamble has unknown header \"${header}\".`,
            node,
          });
        }
      });

      // Validate header order
      const orderedHeaders = HEADERS_REGEX.exec(node.value)?.slice(1) ?? [];
      let orderIndex = 0;
      for (const header of orderedHeaders) {
        if (
          HEADER_ORDER[orderIndex] in orderedHeaders &&
          header !== HEADER_ORDER[orderIndex]
        ) {
          context.report({
            message: `Preamble header \"${header}\" is not in proper order`,
            node,
          });
          break;
        }
        orderIndex++;
      }

      // Validate SIP number
      if (
        preamble.sip !== undefined &&
        (!Number.isSafeInteger(preamble.sip) || preamble.sip < 0)
      ) {
        context.report({
          message: 'Preamble header "sip" is not a positive integer',
          node,
        });
      }

      // Validate that SIP number matches filename
      if (preamble.sip !== undefined) {
        const match = context.path?.match(EXTRACT_PATH_SIP);
        let extractedSip: number | undefined = undefined;
        if (match !== null && match !== undefined) {
          extractedSip = Number(match.groups?.sipNumber ?? 0);
        }
        if (extractedSip === null || extractedSip !== preamble.sip) {
          context.report({
            message: 'Preamble header "sip" doesn\'t match the filename number',
            node,
          });
        }
      }

      // Validate dates
      HEADER_DATES.forEach((dateHeader) => {
        if (
          dateHeader in preamble &&
          !isValidDate(preamble[dateHeader] as string)
        ) {
          context.report({
            message: `Preamble header \"${dateHeader}\" is not a valid date in ISO 8601 format`,
            node,
          });
        }
      });

      // Validate proper status
      if (preamble.status !== undefined && !STATUES.has(preamble.status)) {
        context.report({
          message: 'Preamble header "status" is not a valid status',
          node,
        });
      }

      // Validate discussions-to
      if (
        preamble["discussions-to"] !== undefined &&
        !isValidURL(preamble["discussions-to"], ["http", "https"])
      ) {
        context.report({
          message: `Preamble header "discussions-to" is not a valid http/https url`,
          node,
        });
      }

      // Validate updated
      if (preamble.status === "Living" && !("updated" in preamble)) {
        context.report({
          message:
            'SIP has status of "Living" but doesn\'t have "updated" preamble header',
          node,
        });
      }

      // Validate proper category
      if (
        preamble.category !== undefined &&
        !CATEGORIES.has(preamble.category)
      ) {
        context.report({
          message: 'Preamble header "category" is not a valid category',
          node,
        });
      }

      // Validate author
      if ("author" in preamble) {
        const authors: string[] = (preamble.author as string).split(",");
        let hasGithub = false;
        for (const author of authors) {
          const match = author.trim().match(AUTHOR);
          if (match === null) {
            context.report({
              message: 'Preamble header "author" is malformed',
              node,
            });
            hasGithub = true;
            break;
          }
          if (match.length >= 2) {
            hasGithub = true;
          }
        }
        if (!hasGithub) {
          context.report({
            message:
              'Preamble header "author" doesn\'t have at least one github account',
            node,
          });
        }
      }
    },
  }),
};
export default descriptor;
