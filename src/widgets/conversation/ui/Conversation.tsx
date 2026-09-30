import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  Motion,
  spring,
  type PlainStyle,
  type SpringConfig,
} from "react-motion";
import {
  MessageText,
  isMessage,
  type ChatItem,
  type StackPosition,
  type TextMessage,
} from "@/entities/message/index.ts";
import { Author } from "@/entities/author/index.ts";
import { AvatarSlot } from "@/entities/avatar/index.ts";
import { Checkmark } from "@/entities/checkmark/index.ts";
import { Tail } from "@/entities/tail/index.ts";
import { Typing } from "@/entities/typing/index.ts";
import { Unread } from "@/entities/unread/index.ts";
import s from "./Conversation.module.scss";

const POP: SpringConfig = { stiffness: 420, damping: 24 };

function paceOf(message: ChatItem) {
  if (!isMessage(message)) {
    return { pause: message.kind === "unread" ? 173 : 147, lead: 0 };
  }
  const text = message.textBefore ?? message.text;
  const hold = Math.min(1733, 367 + text.length * 23);
  if (message.side === "in") return { pause: 120, lead: hold };
  return { pause: hold, lead: 0 };
}

function groupWith(left: ChatItem | undefined, right: ChatItem | undefined) {
  if (!isMessage(left) || !isMessage(right)) return false;
  return left.side === right.side && left.from === right.from;
}

function stackPosition(
  prev: ChatItem | undefined,
  message: TextMessage,
  next: ChatItem | undefined,
): StackPosition {
  const withPrev = groupWith(prev, message);
  const withNext = groupWith(message, next);
  if (withPrev && withNext) return "mid";
  if (withPrev) return "last";
  if (withNext) return "first";
  return "single";
}

function Pop({
  origin,
  children,
  still = false,
}: {
  origin: string;
  children: ReactNode;
  still?: boolean;
}) {
  if (still) {
    return <div className={s.pop}>{children}</div>;
  }

  return (
    <Motion
      defaultStyle={{ opacity: 0, y: 16, scale: 0.82 }}
      style={{
        opacity: spring(1, { stiffness: 260, damping: 26 }),
        y: spring(0, POP),
        scale: spring(1, POP),
      }}
    >
      {(value: PlainStyle) => (
        <div
          className={s.pop}
          style={{
            opacity: value.opacity,
            transform: `translate3d(0, ${value.y}px, 0) scale(${value.scale})`,
            transformOrigin: origin,
          }}
        >
          {children}
        </div>
      )}
    </Motion>
  );
}

function Bubble({
  message,
  position,
  showEdited,
  onLink,
}: {
  message: TextMessage;
  position: StackPosition;
  showEdited: boolean;
  onLink?: (url: string) => void;
}) {
  const origin = message.side === "out" ? "right bottom" : "left bottom";
  const showName =
    Boolean(message.name) && (position === "single" || position === "first");
  const tailed = message.id === "girls";

  return (
    <Pop origin={origin} still={Boolean(message.avatar)}>
      <div
        className={clsx(
          s.row,
          s[message.side],
          (position === "mid" || position === "last") && s.grouped,
        )}
      >
        {message.side === "in" && (
          <AvatarSlot show={Boolean(message.avatar)} isFriend={Boolean(message.friend)} />
        )}
        <div
          className={clsx(
            s.bubble,
            s[message.side],
            s[position],
            showName && s.hasName,
            tailed && s.tailed,
          )}
        >
          {showName && message.name && (
            <Author name={message.name} role={message.role} emoji={message.emoji} />
          )}
          {message.reply && (
            <div className={s.reply}>
              <span className={s.replyBar} />
              <span className={s.replyBody}>
                <span className={s.replyName}>{message.reply.name}</span>
                <span className={s.replyText}>{message.reply.text}</span>
              </span>
            </div>
          )}
          <p className={s.text}>
            <span className={s.body}>
              <MessageText
                text={
                  showEdited || !message.textBefore
                    ? message.text
                    : message.textBefore
                }
                onLink={onLink}
              />
            </span>
            <span className={s.metaSpacer} aria-hidden="true">
              {showEdited && <span className={s.edited}>изменено</span>}
              <span className={s.time}>{message.time}</span>
              {message.read && <Checkmark />}
            </span>
            <span className={s.meta}>
              {showEdited && (
                <Motion
                  defaultStyle={{ opacity: 0 }}
                  style={{
                    opacity: spring(1, { stiffness: 320, damping: 28 }),
                  }}
                >
                  {(value: PlainStyle) => (
                    <span
                      className={s.edited}
                      style={{ opacity: value.opacity }}
                    >
                      изменено
                    </span>
                  )}
                </Motion>
              )}
              <span className={s.time}>{message.time}</span>
              {message.read && <Checkmark />}
            </span>
          </p>
          {tailed && <Tail />}
        </div>
      </div>
    </Pop>
  );
}

export function Conversation({
  messages,
  onLink,
  onDone,
  label = "Переписка в Telegram",
}: {
  messages: ChatItem[];
  onLink?: (url: string) => void;
  onDone?: () => void;
  label?: string;
}) {
  const [count, setCount] = useState(0);
  const [typingAvatar, setTypingAvatar] = useState(false);
  const [typingFriend, setTypingFriend] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [editedIds, setEditedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const scheduledEdits = useRef(new Set<string>());
  const editTimers = useRef<number[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const finish = useRef(onDone);

  useEffect(() => {
    finish.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (reduceMotion.current) {
      setCount(messages.length);
      return undefined;
    }
    if (count >= messages.length) return undefined;

    const message = messages[count];
    if (!message) return undefined;
    const { pause, lead } = paceOf(message);
    let revealTimer: ReturnType<typeof setTimeout> | undefined;

    const waitTimer = setTimeout(() => {
      if (lead > 0 && isMessage(message)) {
        setTypingAvatar(Boolean(message.avatar));
        setTypingFriend(Boolean(message.friend));
        setShowTyping(true);
      }
      revealTimer = setTimeout(() => {
        setShowTyping(false);
        setCount((value) => value + 1);
      }, lead);
    }, pause);

    return () => {
      clearTimeout(waitTimer);
      clearTimeout(revealTimer);
    };
  }, [count, messages]);

  useEffect(() => {
    if (!onDone || count < messages.length) return undefined;
    const timer = window.setTimeout(() => finish.current?.(), reduceMotion.current ? 900 : 2000);
    return () => window.clearTimeout(timer);
  }, [count, messages.length, onDone]);

  useEffect(() => {
    const timers = editTimers.current;

    for (const message of messages.slice(0, count)) {
      if (!isMessage(message) || message.editedAfter == null) continue;
      if (scheduledEdits.current.has(message.id)) continue;
      scheduledEdits.current.add(message.id);

      if (reduceMotion.current || message.editedAfter <= 0) {
        setEditedIds((current) => new Set(current).add(message.id));
        continue;
      }

      const id = message.id;
      timers.push(
        window.setTimeout(() => {
          setEditedIds((current) => new Set(current).add(id));
        }, message.editedAfter),
      );
    }
  }, [count, messages]);

  useEffect(() => {
    const timers = editTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTo({
      top: feed.scrollHeight,
      behavior: reduceMotion.current ? "auto" : "smooth",
    });
  }, [count, showTyping]);

  const visible = messages.slice(0, count);
  const hideUnread = visible.some((item) => isMessage(item) && item.id === "variant");

  return (
    <section className={s.screen} aria-label={label}>
      <div className={s.feed} ref={feedRef}>
        {visible.map((message, index) => {
          if (message.kind === "unread") {
            if (hideUnread) return null;
            return (
              <Pop key={message.id} origin="center">
                <Unread />
              </Pop>
            );
          }

          if (message.kind === "date") {
            return (
              <Pop key={message.id} origin="center">
                <p className={s.date}>{message.text}</p>
              </Pop>
            );
          }

          const position = stackPosition(
            visible[index - 1],
            message,
            visible[index + 1],
          );
          return (
            <Bubble
              key={message.id}
              message={message}
              position={position}
              showEdited={editedIds.has(message.id)}
              onLink={onLink}
            />
          );
        })}
        {showTyping && (
          <Pop key={`typing-${count}`} origin="left bottom">
            <Typing avatar={typingAvatar} friend={typingFriend} />
          </Pop>
        )}
      </div>
    </section>
  );
}
