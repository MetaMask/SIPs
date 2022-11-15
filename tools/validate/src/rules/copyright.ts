import { Root } from "mdast";
import { lintRule } from "unified-lint-rule";
import { location } from "vfile-location";
import { deepContains } from "../utils.js";

const COPYRIGHT_POSTAMBLES = [
  [
    {
      type: "heading",
      depth: 2,
      children: [
        {
          type: "text",
          value: "Copyright",
        },
      ],
    },
    {
      type: "paragraph",
      children: [
        { type: "text", value: "Copyright and related rights waived via " },
        {
          type: "link",
          url: "../LICENSE",
          children: [{ type: "text", value: "CC0" }],
        },
      ],
    },
  ],
  [
    {
      type: "heading",
      depth: 1,
      children: [
        {
          type: "text",
          value: "Copyright",
        },
      ],
    },
    {
      type: "paragraph",
      children: [
        { type: "text", value: "Copyright and related rights waived via " },
        {
          type: "link",
          url: "../LICENSE",
          children: [{ type: "text", value: "CC0" }],
        },
      ],
    },
  ],
];

const rule = lintRule<Root>("sip:copyright", (tree, file) => {
  // There might be definitions and footnotes after a copyright, they are allowed as they're markup and not content
  let definitionsCount = 0;
  while (
    ["definition", "footnoteDefinition"].includes(
      tree.children.at(-1 - definitionsCount)?.type ?? "<error>"
    )
  ) {
    definitionsCount++;
  }

  const slice = tree.children.slice(-2 - definitionsCount);

  if (
    tree.children.length - definitionsCount < 2 ||
    !COPYRIGHT_POSTAMBLES.some((postamble) => deepContains(slice, postamble))
  ) {
    const place = location(file);
    file.message(
      "No copyright postamble found or is malformed",
      place.toPoint(Math.max(file.value.length - 1, 0))
    );
  }
});

export default rule;
