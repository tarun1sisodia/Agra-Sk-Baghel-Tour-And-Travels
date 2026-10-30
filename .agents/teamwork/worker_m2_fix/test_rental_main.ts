import { getDistHtml } from "../../../react/scripts/pagespeed-test-utils.ts";

function findMainDeepest(html: string) {
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const voidTags = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"
  ]);

  const mainStart = clean.indexOf("<main");
  const mainEnd = clean.indexOf("</main>") + 7;
  const mainHtml = clean.slice(mainStart, mainEnd);

  let maxDepth = 0;
  let currentDepth = 0;
  const stack: string[] = [];
  let deepestStack: string[] = [];

  const tagRegex = /<\/?([a-zA-Z0-9-]+)(?:\s+([^>]*))?\/?>/g;
  let match;

  while ((match = tagRegex.exec(mainHtml)) !== null) {
    const isClosing = match[0].startsWith("</");
    const isSelf = match[0].endsWith("/>");
    const tagName = match[1].toLowerCase();
    const attrs = match[2] || "";

    if (isClosing) {
      stack.pop();
      currentDepth--;
    } else {
      currentDepth++;
      const tagDesc = `<${tagName} class="${(attrs.match(/class="([^"]*)"/)?.[1] || "").slice(0, 30)}">`;
      stack.push(tagDesc);
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        deepestStack = [...stack];
      }
      if (isSelf || voidTags.has(tagName)) {
        stack.pop();
        currentDepth--;
      }
    }
  }

  return { maxDepth, deepestStack };
}

const html = getDistHtml("/en/taxis/rent/");
const { maxDepth, deepestStack } = findMainDeepest(html);
console.log(`\n=== Route: /en/taxis/rent/ inside <main> (Max Depth inside main: ${maxDepth}) ===`);
deepestStack.forEach((s, i) => console.log(`  ${i + 1}: ${s}`));
