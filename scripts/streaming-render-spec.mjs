// Behavioral regression spec for the streaming markdown renderer.
//
// What this guards against
// -------------------------
// When an LLM streams a response token by token, "Title\n-" lands in
// one chunk and "Title\n- item" in the next. With markdown-it's setext
// heading rule (lheading) enabled, the first frame renders <h2>Title</h2>
// — a sudden size+weight+margin jump — and the second frame reverts to
// a paragraph. The user sees the previous line "grow" briefly. Disabling
// lheading eliminates the flip while keeping ATX headings (`#`, `##`, …)
// fully working.
//
// How to run
// ----------
//   yarn test:render
//   # or directly:
//   node scripts/streaming-render-spec.mjs
//
// Sync note
// ---------
// This script mirrors the markdown-it `.disable(...)` call in
// src/utils/chat/markdown.js. If that call changes, update both — the
// drift check below will alert you on first run.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import markdownIt from "markdown-it";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(__dirname, "../src/utils/chat/markdown.js");

// --- Drift sentinel: bail out loudly if production renderer no longer
// matches what this spec is mirroring.
const sourceText = fs.readFileSync(sourcePath, "utf8");
const expectedDisable = /\.disable\(\[\s*"list"\s*,\s*"lheading"\s*\]\)/;
if (!expectedDisable.test(sourceText)) {
  console.error(
    "Drift detected: src/utils/chat/markdown.js no longer calls\n" +
      '  .disable(["list", "lheading"])\n' +
      "Update this spec and the source together."
  );
  process.exit(2);
}

const md = markdownIt({ html: false, typographer: true }).disable([
  "list",
  "lheading",
]);

let failures = 0;
function assert(label, condition) {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`  ${status}  ${label}`);
}

console.log("streaming markdown render — setext flicker contract");

assert(
  "'Title\\n-' must NOT render as <h2> (setext flicker)",
  !/<h2>/.test(md.render("Title\n-"))
);
assert(
  "'Title\\n---' must NOT render as <h2>",
  !/<h2>/.test(md.render("Title\n---"))
);
assert(
  "'Title\\n===' must NOT render as <h1>",
  !/<h1>/.test(md.render("Title\n==="))
);
assert(
  "'# Header' must still render as <h1>Header</h1> (ATX still works)",
  /<h1>Header<\/h1>/.test(md.render("# Header"))
);

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nall good");
