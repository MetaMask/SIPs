import { lintRule } from "unified-lint-rule";

const SIP_FILENAME = /^sip-[1-9][0-9]*\.md$/;

const rule = lintRule<any>("sip:filename", (_, file) => {
  if (file.basename !== undefined && !SIP_FILENAME.test(file.basename)) {
    file.message(`File doesn't have a filename in "sip-N.md" format`);
  }
});

export default rule;
