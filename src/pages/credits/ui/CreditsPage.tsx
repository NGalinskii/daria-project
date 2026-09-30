import { Credits } from "@/widgets/credits/index.ts";
import s from "./CreditsPage.module.scss";

export function CreditsPage() {
  return (
    <main className={s.page} aria-label="Титры">
      <Credits />
    </main>
  );
}
