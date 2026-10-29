import { useEffect, useState } from "react";
import { BuddyAvatar } from "./BuddyAvatar";
import { useBuddyGuide } from "./useBuddyGuide";
import { onUserInteractionOrIdle } from "../../utils/deferredRevalidation";
import "./buddy.css";

const DISMISS_KEY = "baghel-buddy-dismissed";

/**
 * Floating Baghel Buddy mascot for the customer site.
 *
 * Buddy is alive: his pupils track your cursor and clicks, and when you focus
 * or tap a form field (or the one-way / round-trip selector), he glides next
 * to it, looks at it, and offers a contextual tip.
 *
 * Purely additive chrome: it never touches locked layouts or the booking flow.
 */
function BuddyActiveWidget() {
  const [dismissed, setDismissed] = useState(false);
  const [animation, setAnimation] = useState("idle");
  const { lookAtRef, spotlight, homeTipText } = useBuddyGuide();

  // Client-only: restore dismissal.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* storage unavailable — keep visible */
    }
  }, []);

  if (dismissed) return null;

  const cheer = () => {
    setAnimation("excited");
    window.setTimeout(() => setAnimation("idle"), 2600);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const bubbleText = spotlight ? spotlight.tip : homeTipText;
  const transform = spotlight
    ? `translate(${spotlight.dx.toFixed(1)}px, ${spotlight.dy.toFixed(1)}px)`
    : undefined;

  return (
    <div
      className={`buddy-widget${spotlight ? " buddy-spotlight" : ""}`}
      role="region"
      aria-label="Baghel Buddy travel mascot"
      style={transform ? { transform } : undefined}
    >
      <div className="buddy-bubble" aria-live="polite">
        <p>{bubbleText}</p>
        <button
          type="button"
          className="buddy-close"
          onClick={dismiss}
          aria-label="Dismiss Baghel Buddy"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <button
        type="button"
        className="buddy-avatar-btn buddy-float"
        onClick={cheer}
        aria-label="Baghel Buddy — tap for a cheerful wave"
        title="Say hi to Baghel Buddy"
      >
        <BuddyAvatar animation={animation} size={76} lookAtRef={lookAtRef} />
      </button>
    </div>
  );
}

export function BuddyWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const cleanup = onUserInteractionOrIdle(() => {
      setMounted(true);
    }, 15000);
    return cleanup;
  }, []);

  if (!mounted) return null;
  return <BuddyActiveWidget />;
}
