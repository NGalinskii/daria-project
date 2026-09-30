import avatar from "@/shared/assets/images/avatar.jpg";
import friendAvatar from "@/shared/assets/images/avatar-friend.png";
import s from "./Avatar.module.scss";

export function Avatar({ isFriend = false }: { isFriend?: boolean }) {
  return <img className={s.avatar} src={isFriend ? friendAvatar : avatar} alt="" />;
}

export function AvatarSlot({
  isFriend = false,
  show = false,
}: {
  isFriend?: boolean;
  show?: boolean;
}) {
  return <span className={s.slot}>{show && <Avatar isFriend={isFriend} />}</span>;
}
