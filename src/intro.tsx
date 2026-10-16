import { createRoot } from "react-dom/client"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import "./intro.css"

declare global {
  interface Window {
    podiumIntro?: { active: boolean; finish: () => void }
  }
}

const container = document.getElementById("intro-root")
const gate = window.podiumIntro
if (container && gate?.active) {
  const root = createRoot(container)
  const cleanup = () => root.unmount()
  window.addEventListener("podium-intro-finished", cleanup, { once: true })
  root.render(
    <div className="absolute inset-0 overflow-hidden bg-black">
      <ShaderAnimation onUnavailable={gate.finish} />
      <div className="intro-vignette absolute inset-0" />
      <p className="intro-wordmark"><span>Podium</span>{" "}<span className="intro-air">Air</span></p>
    </div>,
  )
}

import "./hero"
