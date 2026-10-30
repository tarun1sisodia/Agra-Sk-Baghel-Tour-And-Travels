import fs from 'node:fs';

const html = fs.readFileSync('react/dist/index.html', 'utf8');
const clean = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '');

const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

interface Node {
  tag: string;
  attrs: string;
  children: Node[];
  parent?: Node;
  id?: string;
  className?: string;
}

const rootNode: Node = { tag: 'root', attrs: '', children: [] };
let currentNode = rootNode;

const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>|<\/([a-zA-Z0-9-]+)>/g;
let m: RegExpExecArray | null;

while ((m = tagRegex.exec(clean)) !== null) {
  const full = m[0];
  const isClosing = full.startsWith('</');
  const isSelf = full.endsWith('/>');
  const tagName = (m[1] || m[3]).toLowerCase();

  if (isClosing) {
    if (currentNode.parent) {
      currentNode = currentNode.parent;
    }
  } else {
    const attrs = m[2] || '';
    const idMatch = attrs.match(/id="([^"]+)"/);
    const classMatch = attrs.match(/class="([^"]+)"/);
    const node: Node = {
      tag: tagName,
      attrs,
      children: [],
      parent: currentNode,
      id: idMatch ? idMatch[1] : undefined,
      className: classMatch ? classMatch[1] : undefined,
    };
    currentNode.children.push(node);
    if (!isSelf && !voidTags.has(tagName)) {
      currentNode = node;
    }
  }
}

function countNodes(n: Node): number {
  let count = 1;
  for (const c of n.children) {
    count += countNodes(c);
  }
  return count;
}

function describeNode(n: Node): string {
  let s = n.tag;
  if (n.id) s += `#${n.id}`;
  else if (n.className) s += `.${n.className.split(' ').filter(Boolean).slice(0, 2).join('.')}`;
  return s;
}

function printSectionTree(n: Node, indent = 0) {
  const desc = describeNode(n);
  const count = countNodes(n);
  console.log(`${' '.repeat(indent)}${desc.padEnd(50 - indent)} : count=${count}`);
  for (const c of n.children) {
    if (countNodes(c) > 10) {
      printSectionTree(c, indent + 2);
    }
  }
}

printSectionTree(rootNode);
