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

export function* enumerate<T>(iterable: Iterable<T>): Generator<[number, T]> {
  const iterator = iterable[Symbol.iterator]();

  let i = 0;
  while (true) {
    const result = iterator.next();
    if (result.done) {
      break;
    }
    yield [i, result.value];
    i++;
  }
}
