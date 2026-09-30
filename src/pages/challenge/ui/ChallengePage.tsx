import type { ChallengeId } from "@/app/model/flow.ts";
import s from "./ChallengePage.module.scss";

const LABEL: Record<ChallengeId, string> = {
  chess: "Шахматы",
  tetris: "Тетрис",
  flappy: "Flappy Bird",
  lighthouse: "Маяк",
  test: "Тест",
  after: "Переписка",
  credits: "Титры",
};

export function ChallengePage({ screen }: { screen: ChallengeId }) {
  return (
    <section
      className={s.page}
      data-screen={screen}
      aria-label={LABEL[screen]}
    />
  );
}
