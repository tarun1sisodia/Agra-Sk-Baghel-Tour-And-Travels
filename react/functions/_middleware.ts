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

function resolveLegacyRedirect(pathname: string): string | null {
  const norm = pathname.toLowerCase();

  // 1. Hindi URLs
  if (norm.startsWith("/hi/") || norm === "/hi") {
    if (norm === "/hi" || norm === "/hi/") return "/";
    if (norm.includes("/faq")) return "/en/faq/";
    if (norm.includes("/routes")) return "/en/routes/";
    if (norm.includes("/fleet")) return "/en/fleet/";
    if (norm.includes("/services")) return "/en/services/";
    if (norm.includes("/about")) return "/en/about/";
    if (norm.includes("/contact")) return "/en/contact/";
    if (norm.includes("/privacy")) return "/privacy-policy/";
    if (norm.includes("/terms")) return "/terms-and-conditions/";
    if (norm.includes("taj-mahal-taxi-service")) return "/en/monuments/taj-mahal/";
    if (norm.includes("tempo-traveller")) return "/en/vehicles/tempo-traveller/";
    if (norm.includes("agra-se-delhi-taxi")) return "/en/agra-to-delhi-taxi/";
    if (norm.includes("delhi-se-agra-taxi")) return "/en/delhi-to-agra-taxi/";
    if (norm.includes("agra-se-jaipur-taxi") || norm.includes("delhi-se-jaipur-taxi")) return "/en/agra-to-jaipur-taxi/";
    if (norm.includes("agra-se-gwalior-taxi")) return "/en/agra-to-gwalior-taxi/";
    if (norm.includes("agra-se-lucknow-taxi")) return "/en/agra-to-lucknow-taxi/";
    if (norm.includes("agra-se-mathura-taxi")) return "/en/agra-to-mathura-taxi/";
    if (norm.startsWith("/hi/monuments/")) {
      const slug = norm.replace("/hi/monuments/", "").replace(/\/$/, "");
      return `/en/monuments/${slug}/`;
    }
    if (norm.startsWith("/hi/transfers/")) {
      if (norm.includes("airport-noida")) return "/en/transfers/agra-to-noida-international-airport/";
      if (norm.includes("delhi-igi")) return "/en/transfers/agra-to-delhi-airport/";
      const slug = norm.replace("/hi/transfers/", "").replace(/\/$/, "");
      return `/en/transfers/${slug}/`;
    }
    if (norm.startsWith("/hi/local-packages/")) {
      if (norm.includes("knowledge-parak") || norm.includes("extended-city-tour")) return "/en/local-packages/agra-tour-for-international-tourists-full-day/";
      const slug = norm.replace("/hi/local-packages/", "").replace(/\/$/, "");
      return `/en/local-packages/${slug}/`;
    }
    if (norm.startsWith("/hi/packages/")) {
      if (norm.includes("prem-mandir") || norm.includes("mathura-vrindavan")) return "/en/packages/same-day-agra-to-mathura-tour/";
      if (norm.includes("taj-mahal-sunrise")) return "/en/packages/exclusive-tour-of-agra-for-1-day/";
      if (norm.includes("agra-sightseeing") || norm.includes("agra-unhurried")) return "/en/packages/agra-same-day-sightseeing-tour/";
      if (norm.includes("golden-triangle")) return "/en/packages/agra-to-delhi-tour/";
      if (norm.includes("gatimaan-express")) return "/en/packages/exclusive-tour-of-agra-for-1-day/";
      const slug = norm.replace("/hi/packages/", "").replace(/\/$/, "");
      return `/en/packages/${slug}/`;
    }
    return "/";
  }

  // 2. Tempo traveller legacy routes
  if (norm.includes("tempo-traveller") && !norm.startsWith("/en/vehicles/tempo-traveller")) {
    return "/en/vehicles/tempo-traveller/";
  }

  // 3. Known package aliases
  if (norm.includes("gatimaan-express-agra-tour") || norm.includes("taj-mahal-sunrise-tour-package-by-car")) {
    return "/en/packages/exclusive-tour-of-agra-for-1-day/";
  }
  if (norm.includes("same-day-prem-mandir-tour")) {
    return "/en/local-packages/agra-to-mathura-local-sightseeing/";
  }
  if (norm.includes("agra-sightseeing-taxi") || norm.includes("agra-local-sightseeing-taxi") || norm.includes("same-day-agra-tour-from-delhi")) {
    return "/en/packages/agra-same-day-sightseeing-tour/";
  }
  if (norm.includes("best-places-to-visit-in-manali")) {
    return "/en/packages/agra-to-manali-tour/";
  }

  // 4. Transfers & railway station
  if (norm.includes("airport-noida")) {
    return "/en/transfers/agra-to-noida-international-airport/";
  }
  if (norm.includes("agra-to-delhi-airport")) {
    return "/en/transfers/agra-to-delhi-airport/";
  }
  if (norm.includes("agra-cantt-railway-station") || norm.includes("agra-cantt-station-transfer")) {
    return "/en/routes/";
  }

  // 5. Canonical routes guard — do NOT redirect valid live routes!
  const canonicalRoutes = [
    "/en/agra-to-delhi-taxi/", "/en/delhi-to-agra-taxi/",
    "/en/agra-to-jaipur-taxi/", "/en/jaipur-to-agra-taxi/",
    "/en/agra-to-gwalior-taxi/", "/en/gwalior-to-agra-taxi/",
    "/en/agra-to-lucknow-taxi/", "/en/lucknow-to-agra-taxi/",
    "/en/agra-to-mathura-taxi/", "/en/mathura-to-agra-taxi/",
    "/en/agra-to-ayodhya-taxi/", "/en/ayodhya-to-agra-taxi/",
    "/en/agra-to-noida/", "/en/noida-to-agra-taxi/",
    "/en/agra-to-gurugram/", "/en/gurugram-to-agra-taxi/",
    "/en/agra-to-mathura/",
    "/en/agra-to-jaipur/",
    "/en/agra-to-lucknow/",
    "/en/agra-to-ayodhya/",
    "/en/agra-to-banaras/", "/en/banaras-to-agra-taxi/",
    "/en/agra-to-prayagraj/", "/en/prayagraj-to-agra-taxi/",
    "/en/agra-to-gwalior/",
    "/en/agra-to-ajmer/", "/en/ajmer-to-agra-taxi/",
    "/en/agra-to-udaipur/", "/en/udaipur-to-agra-taxi/",
    "/en/agra-to-jaisalmer/", "/en/jaisalmer-to-agra-taxi/",
    "/en/agra-to-haridwar/", "/en/haridwar-to-agra-taxi/",
    "/en/agra-to-rishikesh/", "/en/rishikesh-to-agra-taxi/",
    "/en/agra-to-dehradun/", "/en/dehradun-to-agra-taxi/",
    "/en/agra-to-mussoorie/", "/en/mussoorie-to-agra-taxi/",
  ];
  const trailingNorm = norm.endsWith("/") ? norm : norm + "/";
  if (canonicalRoutes.includes(trailingNorm)) {
    return null; // Live route, leave untouched
  }

  // 6. Old micro-location routes
  if (norm.includes("-taxi-services") || norm.includes("-taxi")) {
    if (norm.includes("delhi-to") || (norm.includes("-to-agra-taxi") && norm.includes("delhi"))) return "/en/delhi-to-agra-taxi/";
    if (norm.includes("delhi")) return "/en/agra-to-delhi-taxi/";
    if (norm.includes("gurgaon-to") || norm.includes("gurugram-to")) return "/en/gurugram-to-agra-taxi/";
    if (norm.includes("gurgaon") || norm.includes("gurugram")) return "/en/agra-to-gurugram/";
    if (norm.includes("haridwar-to")) return "/en/haridwar-to-agra-taxi/";
    if (norm.includes("haridwar")) return "/en/agra-to-haridwar/";
    if (norm.includes("lucknow-to")) return "/en/lucknow-to-agra-taxi/";
    if (norm.includes("lucknow")) return "/en/agra-to-lucknow-taxi/";
    if (norm.includes("mathura-to")) return "/en/mathura-to-agra-taxi/";
    if (norm.includes("mathura")) return "/en/agra-to-mathura-taxi/";
    if (norm.includes("jaipur-to")) return "/en/jaipur-to-agra-taxi/";
    if (norm.includes("jaipur")) return "/en/agra-to-jaipur-taxi/";
    if (norm.includes("gwalior-to")) return "/en/gwalior-to-agra-taxi/";
    if (norm.includes("gwalior")) return "/en/agra-to-gwalior-taxi/";
    if (norm.includes("ayodhya-to")) return "/en/ayodhya-to-agra-taxi/";
    if (norm.includes("ayodhya")) return "/en/agra-to-ayodhya-taxi/";
    return "/en/routes/";
  }

  return null;
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

  // 2. Canonical Legacy Route & 404 Prevention Edge Interceptor
  const legacyTarget = resolveLegacyRedirect(url.pathname);
  if (legacyTarget) {
    const targetUrl = new URL(legacyTarget, "https://agraskbagheltourandtravels.com");
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
