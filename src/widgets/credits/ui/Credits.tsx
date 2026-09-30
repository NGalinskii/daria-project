import { useRef } from "react";
import { EPISODE, GROUPS, INTRO, TITLE } from "@/widgets/credits/model/roll.ts";
import s from "./Credits.module.scss";

const FAST = 7;

const STARS = Array.from({ length: 140 }, (_, index) => {
  const next = mulberry(index + 1);
  return {
    left: `${next() * 100}%`,
    top: `${next() * 100}%`,
    size: `${next() * 1.7 + 0.4}px`,
    opacity: next() * 0.7 + 0.25,
  };
});

function mulberry(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function Credits() {
  const crawl = useRef<HTMLDivElement>(null);

  const rate = (value: number) => {
    const animation = crawl.current?.getAnimations()[0];
    if (animation) animation.playbackRate = value;
  };

  return (
    <div
      className={s.sky}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        rate(FAST);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={() => rate(1)}
      onPointerCancel={() => rate(1)}
    >
      <div className={s.stars} aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={index}
            className={s.star}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      <div className={s.board}>
        <div className={s.plane}>
          <div className={s.crawl} ref={crawl}>
            <p className={s.episode}>{EPISODE}</p>
            <h1 className={s.title}>{TITLE}</h1>
            {INTRO.map((paragraph) => (
              <p key={paragraph} className={s.intro}>
                {paragraph}
              </p>
            ))}
            {GROUPS.map((group) => (
              <section key={group.title}>
                <h2 className={s.heading}>{group.title}</h2>
                {group.names.map((name) => (
                  <p key={name} className={s.name}>
                    {name}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
      <div className={s.fade} aria-hidden="true" />
    </div>
  );
}
