import { useCallback, useEffect, useRef } from "react";
import afterFile from "@/shared/assets/json/after.json";
import { loadChat, type ChatFile } from "@/entities/message/index.ts";
import { Conversation } from "@/widgets/conversation/index.ts";
import s from "./AfterPage.module.scss";

const messages = loadChat(afterFile as ChatFile);

export function AfterPage({ onDone }: { onDone: () => void }) {
  const done = useRef(onDone);
  const wait = useRef(0);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => () => window.clearTimeout(wait.current), []);

  const finish = useCallback(() => {
    wait.current = window.setTimeout(() => done.current(), 2000);
  }, []);

  return (
    <main className={s.page} aria-label="Переписка">
      <Conversation messages={messages} onDone={finish} label="Переписка" />
    </main>
  );
}
