import { useEffect, useRef } from "react";
import { createFlappy } from "@/widgets/flappy/game/createFlappy.ts";
import s from "./Flappy.module.scss";

export function Flappy({ onComplete }: { onComplete: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const complete = useRef(onComplete);

  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const node = host.current;
    if (!node) return undefined;

    let cancelled = false;
    let destroy: (() => void) | undefined;

    void createFlappy({
      onComplete: () => complete.current(),
    }).then((game) => {
      if (cancelled) {
        game.destroy();
        return;
      }
      destroy = game.destroy;
      node.appendChild(game.canvas);
      game.fit();
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return <div className={s.game} ref={host} />;
}
