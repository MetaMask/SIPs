import assert from "assert";
import YAML from "yaml";
import { Context } from "../context";
import { AstNode, RuleDescriptor } from "../rule";

const HEADER_ORDER = [
  "sip",
  "title",
  "status",
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
const HEADER_OPTIONAL = new Set(["updated"]);
const HEADER_ALL = new Set([
  ...HEADER_REQUIRED.values(),
  ...HEADER_OPTIONAL.values(),
]);
const HEADER_DATES = new Set(["created", "updated"]);
const STATUES = new Set(["Draft", "Review", "Final", "Withdrawn", "Living"]);
const CATEGORIES = new Set(["Core", "Blockchain", "Meta"]);
const ISO8601 = /^(?<year>\d\d\d\d)-(?<month>\d\d)-(?<day>\d\d)$/m;
const HEADERS_REGEX = /^([a-z]+):.+$/m;

const AUTHOR = /^[\w\s]+ (?:\<.+@.+\>)? (\(@\w+\))?$/;

function isValidDate(data: string): boolean {
  const result = ISO8601.exec(data);
  if (result === null || result.length !== 2) {
    return false;
  }
  if (
    result.groups?.year === undefined ||
    result.groups?.month === undefined ||
    result.groups?.day === undefined
  ) {
    return false;
  }
  const year = Number(result.groups.year);
  const month = Number(result.groups.month);
  const day = Number(result.groups.day);
  const now = new Date();
  return (
    year <= now.getFullYear() &&
    month <= now.getMonth() + 1 &&
    day <= now.getDate()
  );
}

const descriptor: RuleDescriptor = {
  meta: {
    id: "preamble",
  },
  create: (context: Context) => ({
    yaml: (node: AstNode) => {
      assert(node.type === "yaml");
      let preamble: any;
      try {
        preamble = YAML.parse(node.value);
        if (typeof preamble !== "object" || preamble === null) {
          throw null;
        }
        Object.values(preamble).forEach((header) => {
          if (typeof header !== "string") {
            throw null;
          }
        });
      } catch (e) {
        return context.report({
          message: "The front-matter is not proper YAML",
          node,
        });
      }

      // Validate all required headers
      const headers = new Set(Object.keys(preamble));
      HEADER_REQUIRED.forEach((required) => {
        if (!headers.has(required)) {
          context.report({
            message: `Required header \"${required}\" is missing from preamble.`,
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

      // Validate dates
      HEADER_DATES.forEach((dateHeader) => {
        if (dateHeader in preamble && !isValidDate(preamble[dateHeader])) {
          context.report({
            message: `Preamble header \"${dateHeader}\" is not a valid date in ISO 8601 format`,
            node,
          });
        }
      });

      // Validate proper status
      if (!STATUES.has(preamble.status)) {
        context.report({
          message: 'Header "status" is not a valid status',
          node,
        });
      }

      // Validate updated
      if (preamble.status === "living" && !("updated" in preamble)) {
        context.report({
          message:
            'SIP has status of "living" but doesn\'t have "updated" header',
          node,
        });
      }

      // Validate proper category
      if (!CATEGORIES.has(preamble.category)) {
        context.report({
          message: 'Header "category" is not a valid category',
          node,
        });
      }

      // Validate author
      const authors: string[] = preamble.author.split(",");
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
    },
  }),
};
export default descriptor;
