import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PromptManagerClient from "../app/PromptManagerClient";
import "../app/globals.css";

if (typeof document !== "undefined") {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <PromptManagerClient />
      </StrictMode>,
    );
  }
}

export default function MainPage() {
  return <PromptManagerClient />;
}
