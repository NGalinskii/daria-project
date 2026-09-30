export const COLS = 10;
export const ROWS = 20;
export const TARGET_LINES = 2;
export const DROP_MS = 360;

const LINE_SCORE = [0, 100, 300, 500, 800];

const BASE = [
  [],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
];

function turn(matrix: number[][]) {
  const size = matrix.length;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => matrix[size - 1 - x]?.[y] ?? 0),
  );
}

const ROTATIONS = BASE.map((matrix) => {
  const turns = [matrix];
  let current = matrix;
  for (let step = 0; step < 3; step += 1) {
    current = turn(current);
    turns.push(current);
  }
  return turns;
});

export type Cell = number;
export type Board = Cell[][];

export type Piece = {
  kind: number;
  rot: number;
  x: number;
  y: number;
};

export type State = {
  board: Board;
  piece: Piece;
  queue: number[];
  score: number;
  lines: number;
  over: boolean;
  won: boolean;
};

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));
}

function shuffleBag() {
  const kinds = [1, 2, 3, 4, 5, 6, 7];
  for (let index = kinds.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = kinds[index] ?? 1;
    kinds[index] = kinds[swap] ?? current;
    kinds[swap] = current;
  }
  return kinds;
}

function take(queue: number[]) {
  const next = queue.length > 0 ? queue : shuffleBag();
  const kind = next[0] ?? 1;
  return { kind, queue: next.slice(1) };
}

function piece(kind: number): Piece {
  return { kind, rot: 0, x: 3, y: 0 };
}

export function cellsOf(item: Piece) {
  const matrix = ROTATIONS[item.kind]?.[item.rot] ?? [];
  const cells: { x: number; y: number }[] = [];
  matrix.forEach((row, y) => {
    row.forEach((filled, x) => {
      if (filled) cells.push({ x: item.x + x, y: item.y + y });
    });
  });
  return cells;
}

function fits(board: Board, item: Piece) {
  return cellsOf(item).every(
    (cell) =>
      cell.x >= 0 &&
      cell.x < COLS &&
      cell.y < ROWS &&
      (cell.y < 0 || board[cell.y]?.[cell.x] === 0),
  );
}

function spawn(board: Board, queue: number[], score: number, lines: number): State {
  const drawn = take(queue);
  const next = piece(drawn.kind);
  if (!fits(board, next)) {
    return { board, piece: next, queue: drawn.queue, score, lines, over: true, won: false };
  }
  return { board, piece: next, queue: drawn.queue, score, lines, over: false, won: false };
}

export function createState(): State {
  return spawn(emptyBoard(), shuffleBag(), 0, 0);
}

function lock(state: State): State {
  const board = state.board.map((row) => row.slice());
  for (const cell of cellsOf(state.piece)) {
    if (cell.y >= 0 && board[cell.y]) board[cell.y]![cell.x] = state.piece.kind;
  }

  let cleared = 0;
  const kept = board.filter((row) => {
    if (row.every((cell) => cell !== 0)) {
      cleared += 1;
      return false;
    }
    return true;
  });
  while (kept.length < ROWS) kept.unshift(Array.from({ length: COLS }, () => 0));

  const score = state.score + (LINE_SCORE[cleared] ?? 0);
  const lines = state.lines + cleared;
  if (lines >= TARGET_LINES) {
    return {
      board: kept,
      piece: state.piece,
      queue: state.queue,
      score,
      lines,
      over: false,
      won: true,
    };
  }
  return spawn(kept, state.queue, score, lines);
}

function slide(state: State, dx: number, dy: number): State | null {
  const next = { ...state.piece, x: state.piece.x + dx, y: state.piece.y + dy };
  if (!fits(state.board, next)) return null;
  return { ...state, piece: next };
}

export function moveLeft(state: State) {
  if (state.over || state.won) return state;
  return slide(state, -1, 0) ?? state;
}

export function moveRight(state: State) {
  if (state.over || state.won) return state;
  return slide(state, 1, 0) ?? state;
}

export function rotate(state: State) {
  if (state.over || state.won) return state;
  const rot = (state.piece.rot + 1) % 4;
  for (const kick of [0, -1, 1, -2, 2]) {
    const next = { ...state.piece, rot, x: state.piece.x + kick };
    if (fits(state.board, next)) return { ...state, piece: next };
  }
  return state;
}

export function tick(state: State) {
  if (state.over || state.won) return state;
  return slide(state, 0, 1) ?? lock(state);
}

export function hardDrop(state: State) {
  if (state.over || state.won) return state;
  let current = state;
  let dropped = slide(current, 0, 1);
  while (dropped) {
    current = dropped;
    dropped = slide(current, 0, 1);
  }
  return lock(current);
}

export function ghostY(state: State) {
  let y = state.piece.y;
  while (fits(state.board, { ...state.piece, y: y + 1 })) y += 1;
  return y;
}

export function matrixOf(kind: number) {
  return ROTATIONS[kind]?.[0] ?? [];
}
