import assert from "assert";
import Debug from "debug";
import isValidPath from "is-valid-path";
import { Definition, Image, Link, Root } from "mdast";
import { lintRule } from "unified-lint-rule";
import { Node } from "unist";
import { visit } from "unist-util-visit";
import { Semaphore } from 'async-mutex';

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

const fetchCache = new Map<string, Promise<Response>>();
const fetchSemaphore = new Semaphore(3);

const fetchWithSemaphore = async (url: string, options: RequestInit) => {
  return fetchSemaphore.runExclusive(async () => {
    // Space out requests a bit.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = fetch(url, options);
    return response;
  });
}

const rule = lintRule<Root>("sip:bad-link", async (tree, file) => {
  const fetchWithLog =
    (node: Node) =>
    async (
      ...args: Parameters<typeof fetch>
    ): ReturnType<typeof fetch> => {
      try {
        const url = args[0] as string;
        const options = args[1] as RequestInit;
        const key = `${options?.method ?? 'GET'}-${url}`;
        if (fetchCache.has(key)) {
          return fetchCache.get(key)!;
        }
        const response = fetchWithSemaphore(url, options);
        fetchCache.set(key, response);
        return response;
      } catch (e) {
        const url = args[0].toString();
        file.message(
          `Url "${url}" is invalid, the server doesn't exist or there's no internet access.`,
          node
        );
        debug("Fetch failed", url, e);

        throw e;
      }
    };

  const testUrl = async (url: string, node: Node) => {
    if (!isExternal(url)) {
      return;
    }
    const fetch = fetchWithLog(node);
    let response = await fetch(url, { method: "HEAD" });
    debug("Fetch responded", "url:", url, "is ok:", response.ok);
    if (!response.ok) {
      debug("Fetch (HEAD) not ok, trying GET", url, response.status);
      response = await fetch(url);
      if (!response.ok) {
        file.message(
          `Url "${url}" is invalid, the server responded with ${response.status}`,
          node
        );
      }
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
