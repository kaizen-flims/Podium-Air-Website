import { useState } from "react"
import { createRoot } from "react-dom/client"
import { WebGLShader } from "@/components/ui/web-gl-shader"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

function HeroMotion() {
  const [paused, setPaused] = useState(false)
  return <>
    <WebGLShader paused={paused} />
    <button type="button" className="hero-motion-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)}>
      {paused ? "Play animation" : "Pause animation"}
    </button>
  </>
}
const motion = document.getElementById("hero-motion")
const download = document.getElementById("hero-download")
if (motion) createRoot(motion).render(<HeroMotion />)
if (download) createRoot(download).render(
  <LiquidButton asChild size="xl" className="hero-download-button">
    <a href="#download"><span>Download Podium Air</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" /></svg></a>
  </LiquidButton>,
)
const header = document.querySelector<HTMLElement>('.site-header')
if (header) {
  const resize = new ResizeObserver(() => document.documentElement.style.setProperty('--hero-header-height', `${header.offsetHeight}px`))
  resize.observe(header)
}
