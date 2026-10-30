import { getDistHtml } from "../../../react/scripts/pagespeed-test-utils.ts";

const html = getDistHtml("/");
const clean = html
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "");

const voidTags = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"
]);

const mainStart = clean.lastIndexOf("<main", clean.indexOf('id="main-content"'));
const mainSub = clean.slice(mainStart);

const tagRegex = /<\/?([a-zA-Z0-9-]+)(?:\s+([^>]*))?\/?>/g;
let match;
let depth = 0;
const stack: { tag: string; attr: string; startCount: number }[] = [];
let totalCount = 0;

while ((match = tagRegex.exec(mainSub)) !== null) {
  const isClosing = match[0].startsWith("</");
  const tagName = match[1].toLowerCase();
  const isSelf = match[0].endsWith("/>") || voidTags.has(tagName);

  if (isClosing) {
    const popped = stack.pop();
    depth--;
    if (depth === 1 && popped) {
      console.log(`Section: <${popped.tag}> ${(popped.attr || "").slice(0, 70)} -> count: ${totalCount - popped.startCount}`);
    }
    if (depth === 0) break;
  } else {
    totalCount++;
    if (depth === 1) {
      stack.push({ tag: tagName, attr: match[2] || "", startCount: totalCount });
    } else {
      stack.push({ tag: tagName, attr: match[2] || "", startCount: totalCount });
    }
    depth++;
    if (isSelf) {
      stack.pop();
      depth--;
    }
  }
}
