import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import s from "./Captcha.module.scss";

type Status = "idle" | "checking" | "passed";

export function Captcha({ onSolved }: { onSolved: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const solved = useRef(false);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (status !== "checking") return undefined;
    const timer = window.setTimeout(
      () => setStatus("passed"),
      reduceMotion.current ? 0 : 1050,
    );
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "passed" || solved.current) return undefined;
    const timer = window.setTimeout(() => {
      solved.current = true;
      onSolved();
    }, reduceMotion.current ? 0 : 1600);
    return () => window.clearTimeout(timer);
  }, [onSolved, status]);

  return (
    <div className={s.widget}>
      <button
        className={clsx(s.control, status !== "idle" && s.locked)}
        type="button"
        role="checkbox"
        aria-checked={status === "passed"}
        aria-busy={status === "checking"}
        onClick={() => {
          if (status === "idle") setStatus("checking");
        }}
      >
        <span className={s.slot}>
          {status === "idle" && <span className={s.box} />}
          {status === "checking" && <span className={s.spinner} />}
          {status === "passed" && (
            <svg className={s.check} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.4 12.5 9.1 17.1 19.7 6.3" />
            </svg>
          )}
        </span>
        <span className={s.label}>
          {status === "idle"
            ? "I'm not a robot"
            : "я выйду замуж за Николая"}
        </span>
      </button>
      <div className={s.brand}>
        <svg className={s.mark} viewBox="0 0 64 64" aria-hidden="true">
          <path
            fill="#80868b"
            d="M54.06 39.17A23.2 23.2 0 0 1 20.4 52.09L24.5 44.99A15 15 0 0 0 46.27 36.64Z"
          />
          <path fill="#80868b" d="M11.37 41.12 24.34 43.36 18.3 52.31Z" />
          <path
            fill="#1a73e8"
            d="M9.94 24.83A23.2 23.2 0 0 1 43.6 11.91L39.5 19.01A15 15 0 0 0 17.73 27.36Z"
          />
          <path fill="#1a73e8" d="M52.63 22.88 39.66 20.64 45.7 11.69Z" />
        </svg>
        <span className={s.brandText}>reCAPTCHA</span>
      </div>
    </div>
  );
}
