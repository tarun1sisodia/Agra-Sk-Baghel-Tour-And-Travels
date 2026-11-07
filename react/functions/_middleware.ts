/**
 * Cloudflare Pages Middleware — Markdown Content Negotiation & Agent Discovery
 * Protocol: https://isitagentready.com/.well-known/agent-skills/markdown-negotiation/SKILL.md
 * Specification: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
 * Link Headers: RFC 8288 & RFC 9727
 *
 * When an AI agent requests a page with `Accept: text/markdown`, this middleware
 * intercepts the HTML response and serves a clean, lightweight Markdown document
 * with `Content-Type: text/markdown` and `x-markdown-tokens` headers. Standard browser
 * requests receive the default full HTML website without any overhead.
 */

interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
  env: Record<string, unknown>;
}

const DISCOVERY_LINK_HEADER =
  '</.well-known/api-catalog>; rel="api-catalog", </openapi.json>; rel="service-desc", </llms.txt>; rel="service-doc", </.well-known/agent-card.json>; rel="describedby"';

function htmlToMarkdown(html: string, pageUrl: string): string {
  // 1. Strip scripts, styles, svgs, noscripts, iframes, and forms
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

  // 2. Extract title & meta description
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "Agra SK Baghel Tour & Travels";

  const metaDescMatch = html.match(/<meta\b[^>]*\bname=["\']description["\'][^>]*\bcontent=["\']([^"\']*)["\']/i);
  const description = metaDescMatch ? metaDescMatch[1].trim() : "";

  // 3. Convert headings
  cleaned = cleaned.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  cleaned = cleaned.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  cleaned = cleaned.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  cleaned = cleaned.replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  // 4. Convert links
  cleaned = cleaned.replace(/<a\b[^>]*\bhref=["\']([^"\']*)["\'][^>]*>([\s\S]*?)<\/a>/gi, (_match, href, text) => {
    const cleanText = text.replace(/<[^>]+>/g, "").trim();
    if (!cleanText) return "";
    return `[${cleanText}](${href})`;
  });

  // 5. Convert lists
  cleaned = cleaned.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");

  // 6. Convert paragraphs, breaks, horizontal rules
  cleaned = cleaned.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");
  cleaned = cleaned.replace(/<hr\s*\/?>/gi, "\n---\n");

  // 7. Strip all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // 8. Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8377;/g, "₹")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");

  // 9. Clean up whitespace and excessive line breaks
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""));

  const bodyContent = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return [
    `# ${title}`,
    description ? `\n> ${description}\n` : "",
    `*Source URL: ${pageUrl}*\n`,
    "---",
    bodyContent,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1. Canonical Apex Redirect: Enforce 301 from www to apex
  if (url.hostname === "www.agraskbagheltourandtravels.com") {
    const targetUrl = new URL(request.url);
    targetUrl.hostname = "agraskbagheltourandtravels.com";
    targetUrl.protocol = "https:";
    return Response.redirect(targetUrl.toString(), 301);
  }

  const acceptHeader = request.headers.get("Accept") || "";

  // If the requester does not prefer markdown, continue standard HTML flow
  if (!acceptHeader.includes("text/markdown")) {
    const response = await next();
    const contentType = response.headers.get("Content-Type") || "";
    const isHtml = contentType.includes("text/html");
    const isHome = url.pathname === "/" || url.pathname === "";

    if (isHtml || isHome) {
      const headers = new Headers(response.headers);
      let modified = false;

      // Ensure charset=utf-8 is explicitly declared in HTTP header
      if (isHtml && !contentType.toLowerCase().includes("charset")) {
        headers.set("Content-Type", "text/html; charset=utf-8");
        modified = true;
      }

      // Ensure Content-Signal is explicitly declared on HTML responses
      if (isHtml && !headers.has("Content-Signal")) {
        headers.set("Content-Signal", "ai-train=no, search=yes, ai-input=yes");
        modified = true;
      }

      // Ensure homepage carries agent discovery Link headers (RFC 8288 & RFC 9727)
      if (isHome && !headers.has("Link")) {
        headers.set("Link", DISCOVERY_LINK_HEADER);
        modified = true;
      }

      if (modified) {
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
    }
    return response;
  }

  // Fetch the rendered page from the static bundle
  const response = await next();
  const contentType = response.headers.get("Content-Type") || "";

  // Only transform HTML documents
  if (!contentType.includes("text/html")) {
    return response;
  }

  const html = await response.text();
  const markdown = htmlToMarkdown(html, request.url);
  const tokenCount = Math.ceil(markdown.length / 4);

  return new Response(markdown, {
    status: response.status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
      "x-markdown-tokens": String(tokenCount),
      "Content-Signal": "ai-train=no, search=yes, ai-input=yes",
      "Link": DISCOVERY_LINK_HEADER,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
