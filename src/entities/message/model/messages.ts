import chatFile from "@/shared/assets/json/messages.json";

export type Side = "in" | "out";
export type StackPosition = "single" | "first" | "mid" | "last";

type AuthorConfig = {
  name?: string;
  role?: string;
  side: Side;
  avatar?: boolean;
  friend?: boolean;
  emoji?: boolean;
};

type RawReply = {
  name: string;
  text: string;
};

type RawMessage = {
  id: string;
  type?: "unread" | "date";
  from?: string;
  text?: string;
  textBefore?: string;
  time: string;
  editedAfter?: number;
  read?: boolean;
  reply?: RawReply;
};

export type TextMessage = {
  id: string;
  kind: "message";
  side: Side;
  from: string;
  name?: string;
  role?: string;
  emoji?: boolean;
  avatar?: boolean;
  friend?: boolean;
  text: string;
  textBefore?: string;
  time: string;
  editedAfter?: number;
  read?: boolean;
  reply?: RawReply;
};

export type UnreadMarker = {
  id: string;
  kind: "unread";
  time: string;
};

export type DateMarker = {
  id: string;
  kind: "date";
  time: string;
  text: string;
};

export type ChatItem = TextMessage | UnreadMarker | DateMarker;

export type ChatFile = {
  authors: Record<string, AuthorConfig>;
  messages: RawMessage[];
};

function timeValue(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function toItem(message: RawMessage, authors: Record<string, AuthorConfig>): ChatItem {
  if (message.type === "unread") {
    return { id: message.id, kind: "unread", time: message.time };
  }
  if (message.type === "date") {
    return { id: message.id, kind: "date", time: message.time, text: message.text ?? "" };
  }

  const known = message.from ? authors[message.from] : undefined;
  const author = known ?? {
    name: message.from,
    side: "in" as const,
  };

  return {
    id: message.id,
    kind: "message",
    side: author.side,
    from: message.from ?? "other",
    name: author.name,
    role: author.role,
    emoji: author.emoji,
    avatar: author.avatar,
    friend: author.friend,
    text: message.text ?? "",
    textBefore: message.textBefore,
    time: message.time,
    editedAfter: message.editedAfter,
    read: message.read ?? author.side === "out",
    reply: message.reply,
  };
}

export function loadChat(source: ChatFile): ChatItem[] {
  return source.messages
    .map((message, index) => ({ message, index }))
    .sort((left, right) => {
      const byTime = timeValue(left.message.time) - timeValue(right.message.time);
      return byTime === 0 ? left.index - right.index : byTime;
    })
    .map(({ message }) => toItem(message, source.authors));
}

export const MESSAGES: ChatItem[] = loadChat(chatFile as ChatFile);

export function isMessage(item: ChatItem | undefined): item is TextMessage {
  return item?.kind === "message";
}
