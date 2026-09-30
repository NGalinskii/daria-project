import { useEffect, useState } from "react";
import { Motion, spring, type PlainStyle } from "react-motion";
import s from "./Checkmark.module.scss";

const DRAW = { stiffness: 260, damping: 24 };
const SECOND_DELAY = 500;

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Checkmark() {
  const [showSecond, setShowSecond] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setTimeout(() => setShowSecond(true), SECOND_DELAY);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <svg
      className={s.checks}
      viewBox="0 0 13 11"
      width="15"
      height="11"
      aria-hidden="true"
    >
      <Motion
        defaultStyle={{ opacity: reduceMotion ? 1 : 0 }}
        style={{ opacity: spring(1, DRAW) }}
      >
        {(value: PlainStyle) => (
          <path
            d="M0.8 5.8 3.5 8.6 8.3 2.2"
            style={{ opacity: value.opacity }}
          />
        )}
      </Motion>
      {showSecond && (
        <Motion
          defaultStyle={{ opacity: reduceMotion ? 1 : 0 }}
          style={{ opacity: spring(1, DRAW) }}
        >
          {(value: PlainStyle) => (
            <path d="M7.1 8.6 11.9 2.2" style={{ opacity: value.opacity }} />
          )}
        </Motion>
      )}
    </svg>
  );
}
