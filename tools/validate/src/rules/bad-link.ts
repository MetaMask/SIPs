import assert from "assert";
import Debug from "debug";
import isValidPath from "is-valid-path";
import { Definition, Image, Link, Root } from "mdast";
import { lintRule } from "unified-lint-rule";
import { Node } from "unist";
import { visit } from "unist-util-visit";

const debug = Debug("validate:rule:bad-link");

function isFragment(url: string) {
  return url.startsWith("#");
}

function isLocal(url: string | URL) {
  url = new URL(url);
  return ["127.0.0.1", "localhost", "::1"].includes(url.hostname);
}

function isExternal(url: string | URL): boolean {
  try {
    url = new URL(url);
  } catch (e) {
    debug(e, typeof url, url);
    assert(typeof url === "string");
    // relative path
    if (isValidPath(url)) {
      return false;
    }
    // #paragraph-references
    if (isFragment(url)) {
      return false;
    }
    debug("Invalid url", url, e);
    throw e;
  }

  return !isLocal(url);
}

const rule = lintRule<Root>("sip:bad-link", async (tree, file) => {
  const testUrl = async (url: string, node: Node) => {
    if (!isExternal(url)) {
      return;
    }
    debug("Fetch", url);
    let response;
    try {
      response = await fetch(url, { method: "HEAD" });
    } catch (e) {
      debug("Fetch failed", url, e);
      file.message(
        `Url "${url}" is invalid, the server doesn't exist or there's no internet access.`,
        node
      );
      return;
    }
    debug("Fetch responded", "url:", url, "is ok:", response.ok);
    if (!response.ok) {
      debug("Fetch not ok", url, response.status, response.statusText);
      file.info(
        `Url "${url}" responded with ${response.status} (using HEAD). Might be invalid link.`,
        node
      );
    }
  };

  const tests: Promise<void>[] = [];

  visit(tree, ["definition", "link", "image"], ((
    node: Definition | Link | Image
  ) => {
    tests.push(testUrl(node.url, node));
  }) as any); // casting to any because the node has specific types

  await Promise.all(tests);
});
export default rule;
