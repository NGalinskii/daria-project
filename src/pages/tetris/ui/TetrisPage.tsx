import { Tetris } from "@/widgets/tetris/index.ts";
import s from "./TetrisPage.module.scss";

export function TetrisPage({ onSolved }: { onSolved: () => void }) {
  return (
    <main className={s.page}>
      <Tetris onComplete={onSolved} />
    </main>
  );
}
