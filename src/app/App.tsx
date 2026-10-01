import avatar from "@/shared/assets/images/avatar.jpg";
import avatarFriend from "@/shared/assets/images/avatar-friend.png";
import minecraftLogo from "@/shared/assets/images/minecraft-logo.png";
import { Stage } from "@/app/ui/Stage.tsx";
import s from "./App.module.scss";

const PRELOAD = [avatar, avatarFriend, minecraftLogo];

export function App() {
  return (
    <>
      <Stage />
      <div className={s.preload} aria-hidden="true">
        {PRELOAD.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
    </>
  );
}
