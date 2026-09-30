import { Flappy } from "@/widgets/flappy/index.ts";
import s from "./FlappyPage.module.scss";

export function FlappyPage({ onSolved }: { onSolved: () => void }) {
  return (
    <main className={s.page}>
      <Flappy onComplete={onSolved} />
    </main>
  );
}
