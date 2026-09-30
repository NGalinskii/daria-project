import { Captcha } from "@/widgets/captcha/index.ts";
import s from "./CaptchaPage.module.scss";

export function CaptchaPage({ onSolved }: { onSolved: () => void }) {
  return (
    <main className={s.page}>
      <Captcha onSolved={onSolved} />
    </main>
  );
}
