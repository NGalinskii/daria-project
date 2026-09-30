import type { ReactNode } from "react";
import { Link } from "@/entities/link/index.ts";

const URL_PATTERN = /https?:\/\/[^\s]+/g;

type Chunk = { kind: "text" | "link"; value: string };

function splitText(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    const raw = match[0];
    const value = raw.replace(/[.,!?;:)]+$/, "");

    if (start > cursor) {
      chunks.push({ kind: "text", value: text.slice(cursor, start) });
    }

    chunks.push({ kind: "link", value });

    if (value.length < raw.length) {
      chunks.push({ kind: "text", value: raw.slice(value.length) });
    }

    cursor = start + raw.length;
  }

  if (cursor < text.length) {
    chunks.push({ kind: "text", value: text.slice(cursor) });
  }

  return chunks;
}

export function MessageText({
  text,
  onLink,
}: {
  text: string;
  onLink?: (url: string) => void;
}) {
  const chunks = splitText(text);
  if (chunks.length === 1 && chunks[0]?.kind === "text") return text;

  const nodes: ReactNode[] = chunks.map((chunk, index) =>
    chunk.kind === "link" ? (
      <Link key={index} onClick={onLink ? () => onLink(chunk.value) : undefined}>
        {chunk.value}
      </Link>
    ) : (
      <span key={index}>{chunk.value}</span>
    ),
  );

  return nodes;
}
