import { useEffect, useRef, useState } from "react";
import { createLighthouse } from "@/widgets/lighthouse/scene/createLighthouse.ts";
import s from "./Lighthouse.module.scss";

const TOUCH_HINT = "Слева — идти, справа — смотреть";
const KEY_HINT = "WASD — идти, мышь — смотреть";

function prefersTouch() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    navigator.maxTouchPoints > 0
  );
}

export function Lighthouse({ onComplete }: { onComplete: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const complete = useRef(onComplete);
  const [hint, setHint] = useState(() =>
    typeof window !== "undefined" && prefersTouch() ? TOUCH_HINT : KEY_HINT,
  );

  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const node = host.current;
    if (!node) return undefined;
    const scene = createLighthouse(node, () => complete.current(), () => setHint(""));
    return () => scene.destroy();
  }, []);

  return (
    <div className={s.scene}>
      <div className={s.view} ref={host} />
      {hint && <p className={s.hint}>{hint}</p>}
    </div>
  );
}
