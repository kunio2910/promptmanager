import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PromptManagerClient from "../app/PromptManagerClient";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Prompt Manager root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <PromptManagerClient />
  </StrictMode>,
);
