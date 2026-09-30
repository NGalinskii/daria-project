import { createRoot } from "react-dom/client";
import { App } from "@/app/App.tsx";
import "@/app/styles/reset.scss";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Не найден корневой элемент");
}

createRoot(root).render(<App />);
