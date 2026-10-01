import { useState } from "react";
import minecraftLogo from "@/shared/assets/images/minecraft-logo.png";
import { questions, testResult, testTitle } from "@/widgets/test/model/questions.ts";
import s from "./Test.module.scss";

function shuffle(items: readonly string[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index] ?? "";
    next[index] = next[swap] ?? current;
    next[swap] = current;
  }
  return next;
}

export function Test({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [orders] = useState(() => questions.map((question) => shuffle(question.answers)));
  const question = questions[index];

  if (finished || !question) {
    return (
      <div className={s.resultLayout}>
        <img className={s.logo} src={minecraftLogo} alt="Minecraft" />
        <div className={s.result}>
          <p className={s.resultLabel}>Результат</p>
          <h1 className={s.resultText}>{testResult}</h1>
          <button type="button" className={s.next} onClick={onComplete}>
            Дальше
          </button>
        </div>
      </div>
    );
  }

  const answers = orders[index] ?? question.answers;

  const choose = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
  };

  return (
    <div className={s.layout}>
      <img className={s.logo} src={minecraftLogo} alt="Minecraft" />
      <p className={s.progress}>
        {testTitle} · {index + 1} / {questions.length}
      </p>
      <div key={question.id} className={s.card}>
        <h1 className={s.question}>{question.text}</h1>
        <div className={s.choices}>
          {answers.map((answer) => (
            <button key={answer} type="button" className={s.choice} onClick={choose}>
              {answer}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
