import { readFileSync } from "node:fs";
import { computeDomMetrics } from "../../../react/scripts/pagespeed-test-utils.ts";

const html = readFileSync("react/dist/index.html", "utf8");
const start = html.indexOf('aria-label="Book your taxi"');
const end = html.indexOf("</section>", start) + 10;
const widgetHtml = html.slice(start, end);
console.log("Widget metrics:", computeDomMetrics(widgetHtml));
