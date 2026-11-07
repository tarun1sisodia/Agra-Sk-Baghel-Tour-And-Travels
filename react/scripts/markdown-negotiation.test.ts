import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { onRequest } from "../functions/_middleware.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const reactRoot = join(scriptDir, "..");
const publicDir = join(reactRoot, "public");

test("robots.txt declares valid Content Signals", async () => {
  const robotsPath = join(publicDir, "robots.txt");
  const robots = await readFile(robotsPath, "utf8");

  assert.match(
    robots,
    /^Content-Signal:\s*ai-train=(?:yes|no),\s*search=(?:yes|no),\s*ai-input=(?:yes|no)/im,
    "robots.txt must declare preferences for ai-train, search, and ai-input (https://contentsignals.org/)"
  );
});

test("middleware handles Accept: text/markdown content negotiation & Link headers", async () => {
  const sampleHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Agra to Delhi Taxi Fare | SK Baghel</title>
    <meta name="description" content="Book private taxi from Agra to Delhi at lowest rates." />
  </head>
  <body>
    <header><nav><a href="/">Home</a></nav></header>
    <main>
      <h1>Agra to Delhi Taxi</h1>
      <p>Clean AC Sedan and SUV cars for one-way drops.</p>
      <ul>
        <li>Sedan: &#8377;10/km</li>
        <li>Innova Crysta: &#8377;18/km</li>
      </ul>
      <p>Visit <a href="/en/contact/">Contact Desk</a> to reserve.</p>
    </main>
  </body>
</html>`;

  // 1. Normal browser request (Accept: text/html) on homepage -> returns Link header
  const browserHomeReq = new Request("https://agraskbagheltourandtravels.com/", {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });

  const browserHomeRes = await onRequest({
    request: browserHomeReq,
    next: async () =>
      new Response(sampleHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    env: {},
  });

  assert.equal(browserHomeRes.headers.get("Content-Type"), "text/html; charset=utf-8");
  const linkHeader = browserHomeRes.headers.get("Link") || "";
  assert.match(linkHeader, /rel=["']api-catalog["']/i, "Homepage must include api-catalog Link relation");
  assert.match(linkHeader, /rel=["']service-desc["']/i, "Homepage must include service-desc Link relation");
  assert.match(linkHeader, /rel=["']service-doc["']/i, "Homepage must include service-doc Link relation");
  assert.match(linkHeader, /rel=["']describedby["']/i, "Homepage must include describedby Link relation");

  // 2. AI agent request (Accept: text/markdown) -> returns negotiated Markdown
  const agentReq = new Request("https://agraskbagheltourandtravels.com/en/agra-to-delhi-taxi/", {
    headers: { Accept: "text/markdown, text/html" },
  });

  const agentRes = await onRequest({
    request: agentReq,
    next: async () =>
      new Response(sampleHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    env: {},
  });

  assert.equal(agentRes.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.equal(agentRes.headers.get("Vary"), "Accept");
  assert.ok(Number(agentRes.headers.get("x-markdown-tokens")) > 0, "x-markdown-tokens must be present");
  assert.equal(agentRes.headers.get("Content-Signal"), "ai-train=no, search=yes, ai-input=yes");

  const md = await agentRes.text();
  assert.ok(md.includes("# Agra to Delhi Taxi"), "Markdown must include main heading");
  assert.ok(md.includes("Book private taxi from Agra to Delhi"), "Markdown must include description");
  assert.ok(md.includes("[Contact Desk](/en/contact/)"), "Markdown must format markdown links");
  assert.ok(md.includes("- Sedan: ₹10/km"), "Markdown must decode rupee sign and lists");
  assert.ok(!md.includes("<html>"), "Markdown must not contain HTML wrappers");
  assert.ok(!md.includes("<header>"), "Markdown must not contain header tags");

  // 3. www subdomain request -> returns 301 redirect to apex preserving path and query
  const wwwReq = new Request("https://www.agraskbagheltourandtravels.com/en/routes/?source=seo", {
    headers: { Accept: "text/html" },
  });
  const wwwRes = await onRequest({
    request: wwwReq,
    next: async () => new Response("OK", { status: 200 }),
    env: {},
  });
  assert.equal(wwwRes.status, 301, "www domain must 301 redirect to apex");
  assert.equal(
    wwwRes.headers.get("Location"),
    "https://agraskbagheltourandtravels.com/en/routes/?source=seo",
    "Location header must preserve path and query on apex domain"
  );

  // 4. HTML response missing charset in Content-Type -> middleware appends charset=utf-8
  const noCharsetReq = new Request("https://agraskbagheltourandtravels.com/en/routes/", {
    headers: { Accept: "text/html" },
  });
  const noCharsetRes = await onRequest({
    request: noCharsetReq,
    next: async () =>
      new Response(sampleHtml, {
        headers: { "Content-Type": "text/html" },
      }),
    env: {},
  });
  assert.equal(
    noCharsetRes.headers.get("Content-Type"),
    "text/html; charset=utf-8",
    "Middleware must enforce charset=utf-8 on text/html responses"
  );
});

test("auth.md exists and meets Agent Registration specification", async () => {
  const authPath = join(publicDir, "auth.md");
  assert.ok(existsSync(authPath), "auth.md must exist in public root");
  const content = await readFile(authPath, "utf8");
  assert.match(content, /^#\s+auth\.md/im, "auth.md must have an H1 containing auth.md");
  assert.ok(content.includes("oauth-protected-resource"), "auth.md must reference PRM document");
  assert.ok(content.includes("oauth-authorization-server"), "auth.md must reference Authorization Server metadata");
});

test("A2A Agent Card and AP2 extension are valid", async () => {
  const cardPath = join(publicDir, ".well-known", "agent-card.json");
  assert.ok(existsSync(cardPath), "agent-card.json must exist in .well-known");
  const card = JSON.parse(await readFile(cardPath, "utf8"));
  assert.ok(card.name && card.version && card.description, "Agent card must have name, version, and description");
  assert.ok(Array.isArray(card.skills) && card.skills.length > 0, "Agent card must list skills");
  assert.ok(Array.isArray(card.supportedInterfaces) && card.supportedInterfaces.length > 0, "Agent card must list supported interfaces");

  const ap2 = card.extensions?.find((e: { uri?: string }) => e.uri?.includes("google-agentic-commerce/AP2"));
  assert.ok(ap2, "Agent card must include AP2 extension");
  assert.equal(ap2.required, true, "AP2 extension must be marked required for merchant");
  assert.ok(ap2.params?.roles?.includes("merchant"), "AP2 extension must declare role 'merchant'");
});

test("Agent Skills Discovery Index and SKILL.md are valid", async () => {
  const indexPath = join(publicDir, ".well-known", "agent-skills", "index.json");
  assert.ok(existsSync(indexPath), "agent-skills/index.json must exist");
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  assert.equal(index.$schema, "https://schemas.agentskills.io/discovery/0.2.0/schema.json");
  assert.ok(Array.isArray(index.skills) && index.skills.length > 0, "skills array must be non-empty");

  const skill = index.skills[0];
  assert.ok(skill.name && skill.type === "skill-md" && skill.url && skill.digest, "Skill must declare name, type, url, digest");
  assert.match(skill.digest, /^sha256:[a-f0-9]{64}$/, "Skill digest must be a valid sha256 hex");
});

test("MCP Server Card is valid", async () => {
  const cardPath = join(publicDir, ".well-known", "mcp", "server-card.json");
  assert.ok(existsSync(cardPath), "mcp/server-card.json must exist");
  const card = JSON.parse(await readFile(cardPath, "utf8"));
  assert.ok(card.serverInfo?.name && card.serverInfo?.version, "Server card must include serverInfo");
  assert.ok(card.endpoint, "Server card must include transport endpoint");
  assert.ok(card.capabilities?.tools, "Server card must declare tool capability");
});

test("OAuth PRM and Auth Server metadata are valid", async () => {
  const prmPath = join(publicDir, ".well-known", "oauth-protected-resource");
  assert.ok(existsSync(prmPath), "oauth-protected-resource must exist");
  const prm = JSON.parse(await readFile(prmPath, "utf8"));
  assert.ok(prm.resource, "PRM must declare resource URL");
  assert.ok(Array.isArray(prm.authorization_servers), "PRM must declare authorization_servers");

  const authServerPath = join(publicDir, ".well-known", "oauth-authorization-server");
  assert.ok(existsSync(authServerPath), "oauth-authorization-server must exist");
  const authServer = JSON.parse(await readFile(authServerPath, "utf8"));
  assert.ok(authServer.issuer && authServer.authorization_endpoint && authServer.token_endpoint && authServer.jwks_uri);
  assert.ok(authServer.agent_auth?.skill && authServer.agent_auth?.register_uri, "Auth server must include agent_auth");
});

test("Commerce Protocols (ACP, UCP, MPP openapi.json) are valid", async () => {
  const acpPath = join(publicDir, ".well-known", "acp.json");
  assert.ok(existsSync(acpPath), "acp.json must exist");
  const acp = JSON.parse(await readFile(acpPath, "utf8"));
  assert.equal(acp.protocol?.name, "acp");
  assert.ok(Array.isArray(acp.transports) && acp.transports.length > 0);

  const ucpPath = join(publicDir, ".well-known", "ucp");
  assert.ok(existsSync(ucpPath), "ucp must exist");
  const ucp = JSON.parse(await readFile(ucpPath, "utf8"));
  assert.ok(ucp.protocol_version && Array.isArray(ucp.services));

  const openapiPath = join(publicDir, "openapi.json");
  assert.ok(existsSync(openapiPath), "openapi.json must exist");
  const openapi = JSON.parse(await readFile(openapiPath, "utf8"));
  assert.ok(openapi.openapi && openapi.info);
  const payableOperation = openapi.paths?.["/api/v1/bookings"]?.post;
  assert.ok(payableOperation?.["x-payment-info"], "openapi.json must include x-payment-info on payable operation");
});
