import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs } from "react-chessboard";
import { Game } from "js-chess-engine";
import type { BoardConfig } from "js-chess-engine";
import brilliantMove from "@/shared/assets/images/brilliant-move.png";
import s from "./Chess.module.scss";

const START_FEN = "7k/5Q1p/6K1/8/8/8/8/8 w - - 0 1";

type Outcome = "play" | "mate" | "lost" | "draw";

type MoveSquares = {
  from: string;
  to: string;
};

function outcomeOf(board: BoardConfig): Outcome {
  if (board.checkMate) return board.turn === "black" ? "mate" : "lost";
  if (board.staleMate) return "draw";
  return "play";
}

function destinations(game: Game, from: string) {
  return Object.values(game.moves(from))
    .flat()
    .map((square) => square.toLowerCase());
}

export function Chess({ onComplete }: { onComplete: () => void }) {
  const game = useRef(new Game(START_FEN));
  const complete = useRef(onComplete);
  const timer = useRef<number | null>(null);
  const [fen, setFen] = useState(START_FEN);
  const [outcome, setOutcome] = useState<Outcome>("play");
  const [check, setCheck] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState<MoveSquares | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const settle = (board: BoardConfig) => {
    const next = outcomeOf(board);
    setFen(game.current.exportFEN());
    setCheck(board.check);
    setOutcome(next);
    if (next === "mate") {
      timer.current = window.setTimeout(() => complete.current(), 1200);
    }
    return next;
  };

  const reply = () => {
    const before = game.current.exportJson();
    if (before.isFinished || before.turn !== "black") return;

    setThinking(true);
    timer.current = window.setTimeout(() => {
      try {
        const result = game.current.ai({ level: 3, play: true, ttSizeMB: 1 });
        const played = Object.entries(result.move)[0];
        if (played) {
          const [from, to] = played;
          setLastMove({ from: from.toLowerCase(), to: to.toLowerCase() });
        }
        settle(game.current.exportJson());
      } finally {
        setThinking(false);
      }
    }, 220);
  };

  const play = (from: string, to: string) => {
    if (outcome !== "play" || thinking) return false;
    if (game.current.exportJson().turn !== "white") return false;
    if (!destinations(game.current, from).includes(to)) return false;

    game.current.move(from, to);
    setSelected(null);
    setLastMove({ from, to });
    if (settle(game.current.exportJson()) === "play") reply();
    return true;
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) =>
    Boolean(targetSquare && play(sourceSquare, targetSquare));

  const choose = (square: string | null, pieceType?: string) => {
    if (!square || outcome !== "play" || thinking) return;
    if (selected && play(selected, square)) return;
    if (pieceType?.startsWith("w")) {
      setSelected(square);
      return;
    }
    setSelected(null);
  };

  const restart = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    game.current = new Game(START_FEN);
    setFen(START_FEN);
    setOutcome("play");
    setCheck(false);
    setThinking(false);
    setLastMove(null);
    setSelected(null);
  };

  const status =
    outcome === "mate"
      ? "Brilliant move"
      : outcome === "lost"
        ? "Вам поставили мат"
        : outcome === "draw"
          ? "Ничья"
          : thinking
            ? "Чёрные думают"
            : check
              ? "Шах. Ваш ход"
              : "Поставь мат";

  const marks: Record<string, CSSProperties> = {};
  if (lastMove) {
    marks[lastMove.from] = { backgroundColor: "rgba(255, 255, 80, 0.55)" };
    marks[lastMove.to] = { backgroundColor: "rgba(255, 255, 80, 0.55)" };
  }
  if (selected && outcome === "play" && !thinking) {
    marks[selected] = { backgroundColor: "rgba(255, 255, 80, 0.75)" };
    for (const square of destinations(game.current, selected)) {
      marks[square] = { backgroundColor: "rgba(20, 20, 20, 0.28)" };
    }
  }

  return (
    <div className={s.layout}>
      <p className={s.status}>
        {status}
        {outcome === "mate" && (
          <img className={s.brilliant} src={brilliantMove} alt="" />
        )}
      </p>
      <div className={s.board}>
        <Chessboard
          options={{
            position: fen,
            boardOrientation: "white",
            allowDragging: outcome === "play" && !thinking,
            allowDrawingArrows: false,
            animationDurationInMs: 180,
            darkSquareStyle: { backgroundColor: "#769656" },
            lightSquareStyle: { backgroundColor: "#eeeed2" },
            squareStyles: marks,
            canDragPiece: ({ piece }) => piece.pieceType.startsWith("w"),
            onPieceClick: ({ piece, square }) =>
              choose(square, piece.pieceType),
            onSquareClick: ({ piece, square }) =>
              choose(square, piece?.pieceType),
            onPieceDrop,
          }}
        />
      </div>
      <p className={s.side}>Ты играешь белыми</p>
      {outcome === "lost" || outcome === "draw" ? (
        <button type="button" className={s.retry} onClick={restart}>
          reset, я не думал, что тут можно проиграть
        </button>
      ) : null}
    </div>
  );
}
