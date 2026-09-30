import { useState } from "react";
import { questions, testResult, testTitle } from "@/widgets/test/model/questions.ts";
import s from "./Test.module.scss";

export function Test({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [flip] = useState(() => questions.map(() => Math.random() < 0.5));
  const question = questions[index];

  if (finished || !question) {
    return (
      <div className={s.layout}>
        <p className={s.progress}>{testTitle}</p>
        <div className={s.card}>
          <h1 className={s.question}>{testResult}</h1>
          <button type="button" className={s.choice} onClick={onComplete}>
            Дальше
          </button>
        </div>
      </div>
    );
  }

  const answers = flip[index]
    ? [question.answers[0], question.answers[1]]
    : [question.answers[1], question.answers[0]];

  const choose = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
  };

  return (
    <div className={s.layout}>
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
