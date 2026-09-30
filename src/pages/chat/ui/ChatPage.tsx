import { MESSAGES } from "@/entities/message/index.ts";
import { Conversation } from "@/widgets/conversation/index.ts";
import s from "./ChatPage.module.scss";

export function ChatPage({ onAdvance }: { onAdvance: () => void }) {
  return (
    <main className={s.page}>
      <Conversation messages={MESSAGES} onLink={onAdvance} />
    </main>
  );
}
