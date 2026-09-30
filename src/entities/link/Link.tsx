import type { ReactNode } from "react";
import s from "./Link.module.scss";

export function Link({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className={s.link} type="button" onClick={onClick}>
      {children}
    </button>
  );
}
