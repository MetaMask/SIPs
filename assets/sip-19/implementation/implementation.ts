import stableStringify from "fast-json-stable-stringify";
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@metamask/utils";
import { base64 } from "@scure/base";
import assert from "assert";

export type VFile = { path: string; contents: string };

function stableManifest({ path, contents }: VFile): VFile {
  const structure = JSON.parse(contents);
  delete structure.result.source.shasum;
  return { path, contents: stableStringify(structure) };
}

export function checksumFiles(manifest: VFile, auxiliary: VFile[]): string {
  return base64.encode(
    sha256(
      concatBytes(
        [stableManifest(manifest), ...auxiliary]
          .sort((a, b) => {
            assert(a.path !== b.path, "Duplicate paths detected");
            return a.path < b.path ? -1 : 1;
          })
          .map(({ contents }) => sha256(contents))
      )
    )
  );
}
