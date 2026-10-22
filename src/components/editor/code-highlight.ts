import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import { createLowlight } from "lowlight";

// Code blocks highlighted, the language guessed (there's no way to name it:
// "```" opens the block at once). A short list keeps the guess fast and the
// bundle small; documents only, the landing's hero has no code blocks worth it.
const lowlight = createLowlight({
  bash,
  css,
  go,
  java,
  javascript,
  json,
  python,
  rust,
  sql,
  typescript,
  xml,
  yaml,
});

// Its "```lang " input rule would come back: tiptap.tsx opens on "```" alone.
export const CodeHighlight = CodeBlockLowlight.extend({
  addInputRules: () => [],
}).configure({ lowlight });
