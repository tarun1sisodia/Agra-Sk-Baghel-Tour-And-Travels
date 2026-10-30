import assert from "node:assert/strict";

// Simulation of Component State and Lifecycle

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: (entries: any[]) => void;
  observedElement: any = null;
  disconnected = false;

  constructor(cb: (entries: any[]) => void) {
    this.callback = cb;
    MockResizeObserver.instances.push(this);
  }

  observe(el: any) {
    this.observedElement = el;
  }

  disconnect() {
    this.disconnected = true;
    this.observedElement = null;
  }

  // Simulate browser engine triggering resize
  trigger(entry: { contentRect: { width: number; height: number } }) {
    if (!this.disconnected && this.observedElement) {
      this.callback([entry]);
    }
  }
}

// 1. BASELINE IMPLEMENTATION (Buggy)
function runBaselineSimulation() {
  let windowWidth = 375; // Mobile load
  const navElement = { offsetParent: null, clientWidth: 0, offsetWidth: 0 }; // Hidden in Header.tsx

  const isAuditOrBot = false;
  let isMobileOrHidden = windowWidth < 1280 || navElement.offsetParent === null;

  let glc: any = null;
  let ro: MockResizeObserver | null = null;
  let measureCount = 0;

  // Mount Effect 1: WebGL init
  if (!isMobileOrHidden && !isAuditOrBot) {
    glc = { gl: "mock_webgl" };
  }

  // Mount Effect 3: ResizeObserver setup
  if (!isMobileOrHidden && !isAuditOrBot) {
    ro = new MockResizeObserver(() => {
      measureCount++;
    });
    ro.observe(navElement);
  }

  // AT MOUNT:
  assert.equal(glc, null, "Baseline: WebGL is null on mobile mount");
  assert.equal(ro, null, "Baseline: ResizeObserver is NOT attached on mobile mount (BUG!)");

  // USER RESIZES TO DESKTOP (1440px)
  windowWidth = 1440;
  navElement.offsetParent = {} as any; // display: flex in Header.tsx
  navElement.clientWidth = 650;
  navElement.offsetWidth = 650;

  // In real browser, ResizeObserver would fire here IF it was attached.
  if (ro) {
    ro.trigger({ contentRect: { width: 650, height: 40 } });
  }

  // Verify Baseline result:
  assert.equal(ro, null, "Baseline: ro is still null");
  assert.equal(glc, null, "Baseline: WebGL was never initialized");
  assert.equal(measureCount, 0, "Baseline: measure was never called (NAVBAR IS DEAD!)");
  console.log(" Baseline flaw reproduced: Navbar remained completely dead after mobile -> desktop transition.");
}

// 2. PROPOSED FIX IMPLEMENTATION (Robust Lifecycle)
function runProposedFixSimulation() {
  let windowWidth = 375; // Mobile load
  const navElement = { offsetParent: null, clientWidth: 0, offsetWidth: 0 }; // Hidden

  const isAuditOrBot = false;
  let glc: any = null;
  let webglInitCount = 0;
  let measureCount = 0;
  let isVisible = false;
  let rafRunning = false;

  const initWebGLIfNeeded = () => {
    if (glc) return true;
    webglInitCount++;
    glc = { gl: "mock_webgl_context" };
    return true;
  };

  const measure = () => {
    measureCount++;
    rafRunning = true;
  };

  let lastW = -1;
  // Always attach ResizeObserver on mount (if not audit/bot)
  const ro = new MockResizeObserver((entries) => {
    const entry = entries[0];
    const w = entry?.contentRect ? entry.contentRect.width : (navElement.clientWidth ?? 0);
    const isDesktopVisible =
      w > 0 &&
      windowWidth >= 1280 &&
      navElement.offsetParent !== null;

    if (!isDesktopVisible) {
      isVisible = false;
      rafRunning = false;
      lastW = -1;
      return;
    }

    // Entering desktop: lazy init WebGL if needed
    initWebGLIfNeeded();
    isVisible = true;

    if (lastW < 0 || Math.abs(w - lastW) >= 2) {
      lastW = w;
      measure();
    }
  });

  ro.observe(navElement);

  // Initial trigger from browser on mount (mobile 375px)
  ro.trigger({ contentRect: { width: 0, height: 0 } });

  // Verify mobile mount state:
  assert.ok(ro !== null, "Fix: ResizeObserver IS attached on mount");
  assert.equal(glc, null, "Fix: WebGL is NOT initialized on mobile (0 overhead)");
  assert.equal(measureCount, 0, "Fix: measure is NOT called when hidden");
  assert.equal(isVisible, false, "Fix: isVisible is false");
  assert.equal(rafRunning, false, "Fix: RAF loop is not running");

  // USER RESIZES TO DESKTOP (1440px)
  windowWidth = 1440;
  navElement.offsetParent = {} as any; // display: flex in Header.tsx
  navElement.clientWidth = 650;
  navElement.offsetWidth = 650;

  // Browser engine fires ResizeObserver callback with new width (650px)
  ro.trigger({ contentRect: { width: 650, height: 40 } });

  // Verify desktop transition state:
  assert.equal(webglInitCount, 1, "Fix: WebGL was lazily initialized exactly once");
  assert.ok(glc !== null, "Fix: WebGL context exists");
  assert.equal(isVisible, true, "Fix: Navbar is marked visible");
  assert.equal(measureCount, 1, "Fix: measure was called for desktop layout");
  assert.equal(rafRunning, true, "Fix: RAF loop is active");

  // SUB-PIXEL JITTER EVENT (e.g. 650.8px)
  ro.trigger({ contentRect: { width: 650.8, height: 40 } });
  assert.equal(measureCount, 1, "Fix: Sub-pixel jitter (<2px) was suppressed without re-measuring");

  // USER RESIZES BACK TO MOBILE (<1280px)
  windowWidth = 375;
  navElement.offsetParent = null; // hidden in Header.tsx
  navElement.clientWidth = 0;
  navElement.offsetWidth = 0;

  ro.trigger({ contentRect: { width: 0, height: 0 } });
  assert.equal(isVisible, false, "Fix: isVisible flips back to false on mobile transition");
  assert.equal(rafRunning, false, "Fix: RAF loop stops, 0 CPU cycles used while hidden");
  assert.equal(webglInitCount, 1, "Fix: WebGL context retained without redundant re-creation");

  // USER RESIZES AGAIN TO DESKTOP
  windowWidth = 1440;
  navElement.offsetParent = {} as any;
  navElement.clientWidth = 650;
  ro.trigger({ contentRect: { width: 650, height: 40 } });
  assert.equal(isVisible, true, "Fix: Re-activates on second desktop transition");
  assert.equal(webglInitCount, 1, "Fix: WebGL reused existing context without reallocating");
  assert.equal(measureCount, 2, "Fix: Re-measured to correctly align droplet");

  // UNMOUNT
  ro.disconnect();
  assert.equal(ro.disconnected, true, "Fix: ResizeObserver disconnected on unmount, no leaks");

  console.log(" Proposed fix simulation PASSED 100% of lifecycle assertions!");
}

runBaselineSimulation();
runProposedFixSimulation();
