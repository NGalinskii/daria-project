import { AvatarSlot } from "@/entities/avatar/index.ts";
import s from "./Typing.module.scss";

export function Typing({ avatar = false, friend = false }: { avatar?: boolean; friend?: boolean }) {
  return (
    <div className={s.row}>
      <AvatarSlot show={avatar} isFriend={friend} />
      <div className={s.bubble} aria-hidden="true">
        <span className={s.dot} />
        <span className={s.dot} />
        <span className={s.dot} />
      </div>
    </div>
  );
}
