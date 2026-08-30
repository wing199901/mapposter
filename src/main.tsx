import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { EditorApp } from "@/features/editor/EditorApp"

import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EditorApp />
  </StrictMode>,
)
