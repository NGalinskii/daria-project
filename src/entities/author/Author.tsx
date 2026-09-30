import emojiImage from "@/shared/assets/images/emoji.webp";
import s from "./Author.module.scss";

export function Author({
  name,
  role,
  emoji = false,
}: {
  name: string;
  role?: string;
  emoji?: boolean;
}) {
  return (
    <div className={s.row}>
      <span className={s.name}>
        {name}
        {emoji && <img className={s.emoji} src={emojiImage} alt="" />}
      </span>
      {role && <span className={s.owner}>{role}</span>}
    </div>
  );
}
