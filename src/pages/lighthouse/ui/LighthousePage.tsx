import { Lighthouse } from "@/widgets/lighthouse/index.ts";
import s from "./LighthousePage.module.scss";

export function LighthousePage({ onSolved }: { onSolved: () => void }) {
  return (
    <main className={s.page} aria-label="Маяк">
      <Lighthouse onComplete={onSolved} />
    </main>
  );
}
