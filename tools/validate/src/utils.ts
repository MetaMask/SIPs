import assert from "assert";

export function deepContains(obj: unknown, test: unknown): boolean {
  if (typeof obj !== typeof test) {
    return false;
  }
  // Primitives, strict equality
  if (
    [
      "bigint",
      "boolean",
      "number",
      "string",
      "symbol",
      "undefined",
      "function",
    ].includes(typeof obj) ||
    obj === null
  ) {
    return obj === test;
  }

  // Arrays, test must be smaller length than obj and each index of test must deepContains as well
  if (Array.isArray(obj)) {
    if (!Array.isArray(test) || test.length > obj.length) {
      return false;
    }
    for (const [objChild, testChild] of zip(obj, test)) {
      if (!deepContains(objChild, testChild)) {
        return false;
      }
    }
    return true;
  }

  // Objects, all keys in test must be in obj and all values of those keys must deepContains as well
  assert(
    typeof obj === "object" &&
      obj !== null &&
      typeof test === "object" &&
      test !== null
  );
  for (const [testKey, testValue] of Object.entries(test)) {
    if (!(testKey in obj) || !deepContains((obj as any)[testKey], testValue)) {
      return false;
    }
  }
  return true;
}

export function* zip<T extends Array<any>>(
  ...iterables: { [K in keyof T]: Iterable<T[K]> }
): Generator<T> {
  const iterators = iterables.map((i) => i[Symbol.iterator]());
  while (true) {
    const results = iterators.map((i) => i.next());

    if (results.some(({ done }) => done)) {
      break;
    }

    yield results.map(({ value }) => value) as T;
  }
}

const ISO8601 = /^\d\d\d\d\-\d\d\-\d\d$/;

export function isValidISO8601Date(data: string): boolean {
  const result = data.match(ISO8601);
  if (result === null) {
    return false;
  }
  const date = new Date(data);
  const now = new Date();
  return date <= now;
}

export function isValidURL(url: string, protocols?: string[]): boolean {
  try {
    const parsed = new URL(url);
    return protocols === undefined
      ? true
      : protocols.includes(parsed.protocol.slice(0, -1)); // remove ':' at end
  } catch (e) {
    return false;
  }
}

export function lowercaseFirst(string: string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}
