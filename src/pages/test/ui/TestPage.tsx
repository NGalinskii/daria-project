import { Test } from "@/widgets/test/index.ts";
import s from "./TestPage.module.scss";

export function TestPage({ onSolved }: { onSolved: () => void }) {
  return (
    <main className={s.page} aria-label="Тест">
      <Test onComplete={onSolved} />
    </main>
  );
}
