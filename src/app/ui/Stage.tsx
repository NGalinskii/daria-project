import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { nextScreen, type ScreenId } from "@/app/model/flow.ts";
import musicUrl from "@/shared/assets/sounds/music.m4a";
import { CaptchaPage } from "@/pages/captcha/index.ts";
import { AfterPage } from "@/pages/after/index.ts";
import { ChatPage } from "@/pages/chat/index.ts";
import { CreditsPage } from "@/pages/credits/index.ts";
import { ChessPage } from "@/pages/chess/index.ts";
import { FlappyPage } from "@/pages/flappy/index.ts";
import { LighthousePage } from "@/pages/lighthouse/index.ts";
import { TestPage } from "@/pages/test/index.ts";
import { TetrisPage } from "@/pages/tetris/index.ts";
import s from "./Stage.module.scss";

const BACKDROP: Record<ScreenId, string> = {
  chat: "#111",
  captcha: "#ededed",
  flappy: "#70c5ce",
  chess: "#312e2b",
  tetris: "#1b1b1b",
  lighthouse: "#071018",
  test: "#f3efe8",
  after: "#111",
  credits: "#000",
};

function canSkip() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("skip") === "true";
}

function createMusic() {
  const audio = new Audio(musicUrl);
  audio.loop = true;
  audio.preload = "auto";
  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  });
  return audio;
}

export function Stage() {
  const [screen, setScreen] = useState<ScreenId>("chat");
  const [tone, setTone] = useState<ScreenId>("chat");
  const [showSkip] = useState(canSkip);
  const [leaving, setLeaving] = useState(false);
  const pending = useRef<ScreenId | null>(null);
  const busy = useRef(false);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const music = useRef<HTMLAudioElement | null>(null);

  const startMusic = useCallback(() => {
    if (!music.current) music.current = createMusic();
    if (!music.current.paused) return;
    void music.current.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    const track = music;
    return () => track.current?.pause();
  }, []);

  const go = useCallback((target: ScreenId) => {
    if (busy.current) return;
    busy.current = true;

    if (reduceMotion.current) {
      setScreen(target);
      setTone(target);
      busy.current = false;
      return;
    }

    pending.current = target;
    setTone(target);
    setLeaving(true);
  }, []);

  const advance = useCallback(() => {
    if (screen === "chat") startMusic();
    const target = nextScreen(screen);
    if (target) go(target);
  }, [go, screen, startMusic]);

  const skip = useCallback(() => {
    if (screen === "chat") startMusic();
    const target = nextScreen(screen);
    if (!target) return;
    pending.current = null;
    busy.current = false;
    setLeaving(false);
    setTone(target);
    setScreen(target);
  }, [screen, startMusic]);

  useEffect(() => {
    if (!leaving) return undefined;

    const timer = window.setTimeout(() => {
      const target = pending.current;
      pending.current = null;
      if (target) setScreen(target);
      busy.current = false;
      setLeaving(false);
    }, 420);

    return () => window.clearTimeout(timer);
  }, [leaving]);

  return (
    <div className={s.stage} style={{ backgroundColor: BACKDROP[tone] }}>
      {showSkip && (
        <button type="button" className={s.skip} onClick={skip}>
          Пропустить
        </button>
      )}
      <div key={screen} className={clsx(s.screen, leaving && s.leaving)}>
        {screen === "chat" && <ChatPage onAdvance={advance} />}
        {screen === "chess" && <ChessPage onSolved={advance} />}
        {screen === "flappy" && <FlappyPage onSolved={advance} />}
        {screen === "tetris" && <TetrisPage onSolved={advance} />}
        {screen === "captcha" && <CaptchaPage onSolved={advance} />}
        {screen === "lighthouse" && <LighthousePage onSolved={advance} />}
        {screen === "test" && <TestPage onSolved={advance} />}
        {screen === "after" && <AfterPage onDone={advance} />}
        {screen === "credits" && <CreditsPage />}
      </div>
    </div>
  );
}
