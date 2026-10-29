import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "@/app/App";
import { AppErrorBoundary } from "@/AppErrorBoundary";
import { assertCatalogueInvariants } from "@/data/parity";
import "@/styles/tokens.css";
import "@/styles/theme.css";
import "@/styles/global.css";
import "@/styles/heritage-animations.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("React root element was not found.");
}

if (import.meta.env.DEV) {
  try {
    assertCatalogueInvariants();
  } catch (e) {
    console.warn("Catalogue invariant check warning:", e);
  }
}

const appTree = (
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, appTree);
} else {
  createRoot(root).render(appTree);
}
