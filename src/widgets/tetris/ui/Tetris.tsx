import { useEffect, useRef, useState } from "react";
import {
  COLS,
  DROP_MS,
  TARGET_LINES,
  cellsOf,
  createState,
  ghostY,
  hardDrop,
  matrixOf,
  moveLeft,
  moveRight,
  rotate,
  tick,
  type State,
} from "@/widgets/tetris/game/engine.ts";
import s from "./Tetris.module.scss";

const COLORS = [
  "",
  "#4fd2e0",
  "#f0d54a",
  "#b44ac0",
  "#6fce4a",
  "#e23d3d",
  "#3d6fe2",
  "#ef8a2a",
];

function viewOf(state: State) {
  const cells = state.board.map((row) =>
    row.map((cell) => ({ color: cell, ghost: false })),
  );
  if (!state.over && !state.won) {
    const ghost = ghostY(state);
    if (ghost !== state.piece.y) {
      for (const cell of cellsOf({ ...state.piece, y: ghost })) {
        if (cell.y >= 0 && cells[cell.y]?.[cell.x])
          cells[cell.y]![cell.x] = { color: state.piece.kind, ghost: true };
      }
    }
    for (const cell of cellsOf(state.piece)) {
      if (cell.y >= 0 && cells[cell.y]?.[cell.x])
        cells[cell.y]![cell.x] = { color: state.piece.kind, ghost: false };
    }
  }
  return cells;
}

export function Tetris({ onComplete }: { onComplete: () => void }) {
  const stateRef = useRef(createState());
  const complete = useRef(onComplete);
  const done = useRef(false);
  const [state, setState] = useState(stateRef.current);

  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  const hold = useRef(0);

  const commit = (next: State) => {
    stateRef.current = next;
    setState(next);
    if (next.won && !done.current) {
      done.current = true;
      hold.current = window.setTimeout(() => complete.current(), 700);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (current.over || current.won) return;
      commit(tick(current));
    }, DROP_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(hold.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key;
      if (
        !["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(key)
      )
        return;
      event.preventDefault();
      const current = stateRef.current;
      if (key === "ArrowLeft") commit(moveLeft(current));
      if (key === "ArrowRight") commit(moveRight(current));
      if (key === "ArrowUp") {
        if (event.repeat) return;
        commit(rotate(current));
      }
      if (key === "ArrowDown") commit(tick(current));
      if (key === " ") {
        if (event.repeat) return;
        commit(hardDrop(current));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const restart = () => {
    done.current = false;
    commit(createState());
  };

  const cells = viewOf(state);
  const next = matrixOf(state.queue[0] ?? 1);
  const status = state.won
    ? "Мы будем вместе играть!"
    : state.over
      ? "Стоп"
      : `${state.lines} / ${TARGET_LINES}`;

  return (
    <div className={s.layout}>
      <p className={s.status}>{status}</p>
      <div className={s.stage}>
        <div
          className={s.well}
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {cells.flatMap((row, y) =>
            row.map((cell, x) => (
              <span
                key={`${y}-${x}`}
                className={cell.ghost ? s.ghost : s.cell}
                style={
                  cell.color && !cell.ghost
                    ? { background: COLORS[cell.color] }
                    : undefined
                }
              />
            )),
          )}
        </div>
        <div className={s.next} aria-hidden="true">
          {next.flatMap((row, y) =>
            row.map((filled, x) => (
              <span
                key={`${y}-${x}`}
                className={s.cell}
                style={
                  filled
                    ? { background: COLORS[state.queue[0] ?? 1] }
                    : undefined
                }
              />
            )),
          )}
        </div>
      </div>
      <div className={s.controls}>
        <button
          type="button"
          onClick={() => commit(moveLeft(stateRef.current))}
        >
          ←
        </button>
        <button type="button" onClick={() => commit(rotate(stateRef.current))}>
          ↻
        </button>
        <button
          type="button"
          onClick={() => commit(moveRight(stateRef.current))}
        >
          →
        </button>
        <button
          type="button"
          onClick={() => commit(hardDrop(stateRef.current))}
        >
          ↓
        </button>
      </div>
      {state.over ? (
        <button type="button" className={s.retry} onClick={restart}>
          reset, я не думал, что тут можно проиграть
        </button>
      ) : (
        <p className={s.hint}>← → ↓ пробел, ↑ поворот</p>
      )}
    </div>
  );
}
