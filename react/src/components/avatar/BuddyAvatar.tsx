import { useEffect, useId, useRef } from "react";
import definition from "../../data/baghel-buddy.avatar.json";

/**
 * Baghel Buddy — lightweight procedural avatar renderer.
 *
 * The character design (body, eyes, expressions, animation timelines) is
 * authored in the Bible Strong Avatar Lab model and stored as data in
 * `src/data/baghel-buddy.avatar.json`. This renderer is our own
 * implementation: it reads that definition and plays it back as SVG with a
 * small requestAnimationFrame timeline — no third-party avatar runtime is
 * bundled with the site.
 */

interface EyeParams {
  widthLeft: number; widthRight: number;
  heightLeft: number; heightRight: number;
  spacing: number;
  positionXLeft: number; positionXRight: number;
  positionYLeft: number; positionYRight: number;
  leftAngle: number; rightAngle: number;
  headX: number; headY: number; headZ: number;
}

interface AvatarExpression extends EyeParams {
  id: string;
  perspective: number;
  eyeMotion: string;
  bodyMotion: string;
}

interface AnimationStep {
  expressionId: string;
  holdMs: number;
  transitionMs: number;
  transition: string;
}

interface AvatarAnimation {
  name: string;
  description: string;
  playbackMode: string;
  blink: {
    enabled: boolean;
    initialDelayMs: number;
    minIntervalMs: number;
    maxIntervalMs: number;
    durationMs: number;
  };
  steps: AnimationStep[];
}

interface AvatarDefinition {
  version: number;
  avatar: {
    name: string;
    surface: { type: string; width: number; height: number; depth: number; roundness: number };
    bodyNodes: Array<{
      id: string; name: string;
      surface: { type: string; width: number; height: number; depth: number; roundness: number };
      position: [number, number, number];
      rotation: [number, number, number];
    }>;
    colors: { body: string; eyes: string };
    renderStyle: { type: string };
  };
  expressions: Record<string, AvatarExpression>;
  animations: Record<string, AvatarAnimation>;
}

const DEF = definition as unknown as AvatarDefinition;
const EYE_KEYS: (keyof EyeParams)[] = [
  "widthLeft", "widthRight", "heightLeft", "heightRight", "spacing",
  "positionXLeft", "positionXRight", "positionYLeft", "positionYRight",
  "leftAngle", "rightAngle", "headX", "headY", "headZ",
];

function shade(hex: string, amount: number): string {
  // amount -1..1 : darken / lighten a #rrggbb color
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

function blendExpressions(a: EyeParams, b: EyeParams, t: number, mode: string): EyeParams {
  const k = mode === "smooth" ? smooth(t) : t;
  const out = {} as EyeParams;
  for (const key of EYE_KEYS) out[key] = lerp(a[key], b[key], k);
  return out;
}

export interface BuddyAvatarProps {
  animation?: string;
  size?: number;
  className?: string;
  label?: string;
  /** Mutable viewport-pixel point the pupils track; {-1,-1} = look forward. */
  lookAtRef?: React.RefObject<{ x: number; y: number }>;
}

const SCLERA = "#fffaf3";

export function BuddyAvatar({
  animation = "idle",
  size = 120,
  className = "",
  label = "Baghel Buddy, your travel mascot",
  lookAtRef,
}: BuddyAvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const eyeLRef = useRef<SVGEllipseElement>(null);
  const eyeRRef = useRef<SVGEllipseElement>(null);
  const pupilLRef = useRef<SVGEllipseElement>(null);
  const pupilRRef = useRef<SVGEllipseElement>(null);
  const animRef = useRef(animation);
  animRef.current = animation;

  const { surface, bodyNodes, colors } = DEF.avatar;
  const bodyR = surface.width / 2;
  const neutral = DEF.expressions["expression-neutral"];

  // Static first paint (also what SSG pre-renders): neutral expression.
  const eyeCx = (side: "L" | "R", p: EyeParams) => {
    const w = side === "L" ? p.widthLeft : p.widthRight;
    const off = side === "L" ? p.positionXLeft : p.positionXRight;
    const s = p.spacing / 2 + w / 2;
    return (side === "L" ? -s : s) + off;
  };
  const eyeCy = (side: "L" | "R", p: EyeParams) =>
    (side === "L" ? p.positionYLeft : p.positionYRight);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gaze = { x: 0, y: 0 }; // smoothed, -1..1

    const applyPose = (p: EyeParams, blinkScale = 1) => {
      const face = faceRef.current;
      const el = eyeLRef.current, er = eyeRRef.current;
      const pl = pupilLRef.current, pr = pupilRRef.current;
      if (!face || !el || !er || !pl || !pr) return;
      face.setAttribute(
        "transform",
        `translate(${(p.headY * 0.5).toFixed(2)} ${(p.headX * 0.5).toFixed(2)}) rotate(${(p.headZ * 0.25).toFixed(2)})`
      );
      const lx = eyeCx("L", p), rx = eyeCx("R", p);
      const ly = eyeCy("L", p), ry = eyeCy("R", p);
      const placeEye = (
        e: SVGEllipseElement, pu: SVGEllipseElement,
        cx: number, cy: number, w: number, h: number, angle: number
      ) => {
        e.setAttribute("cx", cx.toFixed(2));
        e.setAttribute("cy", cy.toFixed(2));
        e.setAttribute("rx", (w / 2).toFixed(2));
        e.setAttribute("ry", ((h / 2) * blinkScale).toFixed(2));
        e.setAttribute("transform", `rotate(${angle.toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)})`);
        // Pupil drifts toward the gaze point, clamped inside the sclera.
        // Pupils stay circular: one radius for both axes.
        const pr = Math.min(w, h) * 0.32;
        const px = cx + gaze.x * w * 0.2;
        const py = cy + gaze.y * h * 0.18;
        pu.setAttribute("cx", px.toFixed(2));
        pu.setAttribute("cy", py.toFixed(2));
        pu.setAttribute("rx", pr.toFixed(2));
        pu.setAttribute("ry", (pr * blinkScale).toFixed(2));
      };
      placeEye(el, pl, lx, ly, p.widthLeft, p.heightLeft, p.leftAngle);
      placeEye(er, pr, rx, ry, p.widthRight, p.heightRight, p.rightAngle);
    };

    if (reduced) {
      applyPose(neutral, 1);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    let nextBlink = t0 + 1800;
    let blinkStart = -1;
    // Deterministic pseudo-random for blink intervals (no Math.random in render path).
    let seed = 1234567;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    let cachedCx = -1;
    let cachedCy = -1;
    let lastRectTime = 0;

    const frame = (now: number) => {
      // Gaze: steer pupils toward the tracked viewport point.
      const target = lookAtRef?.current;
      if (target && target.x >= 0 && svg) {
        if (cachedCx < 0 || now - lastRectTime > 2000) {
          lastRectTime = now;
          const r = svg.getBoundingClientRect();
          cachedCx = r.left + r.width / 2;
          cachedCy = r.top + r.height / 2;
        }
        const clamp1 = (v: number) => Math.min(1, Math.max(-1, v));
        const tx = clamp1((target.x - cachedCx) / 140);
        const ty = clamp1((target.y - cachedCy) / 140);
        gaze.x += (tx - gaze.x) * 0.16;
        gaze.y += (ty - gaze.y) * 0.16;
      } else {
        gaze.x *= 0.94;
        gaze.y *= 0.94;
      }

      const anim = DEF.animations[animRef.current] ?? DEF.animations["idle"];
      const steps = anim.steps;
      const total = steps.reduce((s, st) => s + st.transitionMs + st.holdMs, 0) || 1;
      let t = (now - t0) % total;

      // Resolve current pose along the timeline: transition then hold per step.
      let prev: AvatarExpression = DEF.expressions["expression-neutral"];
      let pose: EyeParams = prev;
      let cursor = 0;
      for (const st of steps) {
        const expr = DEF.expressions[st.expressionId] ?? prev;
        if (t < cursor + st.transitionMs && st.transitionMs > 0) {
          pose = blendExpressions(prev, expr, (t - cursor) / st.transitionMs, st.transition);
          break;
        }
        cursor += st.transitionMs;
        if (t < cursor + st.holdMs) {
          pose = expr;
          break;
        }
        cursor += st.holdMs;
        prev = expr;
      }

      // Blink overlay from the animation's blink config.
      let blinkScale = 1;
      if (anim.blink.enabled) {
        if (blinkStart < 0 && now >= nextBlink) blinkStart = now;
        if (blinkStart >= 0) {
          const bp = (now - blinkStart) / anim.blink.durationMs;
          if (bp >= 1) {
            blinkStart = -1;
            const span = anim.blink.maxIntervalMs - anim.blink.minIntervalMs;
            nextBlink = now + anim.blink.minIntervalMs + rand() * span;
          } else {
            blinkScale = 1 - 0.92 * Math.sin(Math.PI * Math.min(1, Math.max(0, bp)));
          }
        }
      }

      applyPose(pose, blinkScale);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gradId = `buddy-body-${uid}`;
  const light = shade(colors.body, 0.42);
  const dark = shade(colors.body, -0.28);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="-126 -158 252 296"
      className={className}
      role="img"
      aria-label={label}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={colors.body} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      {bodyNodes.map((n) => (
        <circle
          key={n.id}
          cx={n.position[0]}
          cy={n.position[1]}
          r={n.surface.width / 2}
          fill={`url(#${gradId})`}
        />
      ))}
      <circle cx={0} cy={0} r={bodyR} fill={`url(#${gradId})`} />
      <g ref={faceRef}>
        <ellipse
          ref={eyeLRef}
          cx={eyeCx("L", neutral)}
          cy={eyeCy("L", neutral)}
          rx={neutral.widthLeft / 2}
          ry={neutral.heightLeft / 2}
          fill={SCLERA}
        />
        <ellipse
          ref={pupilLRef}
          cx={eyeCx("L", neutral)}
          cy={eyeCy("L", neutral)}
          rx={(Math.min(neutral.widthLeft, neutral.heightLeft) * 0.32)}
          ry={(Math.min(neutral.widthLeft, neutral.heightLeft) * 0.32)}
          fill={colors.eyes}
        />
        <ellipse
          ref={eyeRRef}
          cx={eyeCx("R", neutral)}
          cy={eyeCy("R", neutral)}
          rx={neutral.widthRight / 2}
          ry={neutral.heightRight / 2}
          fill={SCLERA}
        />
        <ellipse
          ref={pupilRRef}
          cx={eyeCx("R", neutral)}
          cy={eyeCy("R", neutral)}
          rx={(Math.min(neutral.widthRight, neutral.heightRight) * 0.32)}
          ry={(Math.min(neutral.widthRight, neutral.heightRight) * 0.32)}
          fill={colors.eyes}
        />
      </g>
    </svg>
  );
}
