import { Chess } from "@/widgets/chess/index.ts";
import s from "./ChessPage.module.scss";

export function ChessPage({ onSolved }: { onSolved: () => void }) {
  return (
    <main className={s.page}>
      <Chess onComplete={onSolved} />
    </main>
  );
}
