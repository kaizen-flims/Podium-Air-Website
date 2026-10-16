import { useState } from "react"
import { createRoot } from "react-dom/client"
import { WebGLShader } from "@/components/ui/web-gl-shader"
import { LiquidButton, LiquidGlassSurface } from "@/components/ui/liquid-glass-button"

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

const announcement = document.getElementById("hero-announcement")
const releaseLink = announcement?.querySelector<HTMLAnchorElement>("a")
if (announcement && releaseLink) {
  const href = releaseLink.href
  createRoot(announcement, { identifierPrefix: "release-" }).render(
    <LiquidButton asChild size="sm" className="hero-download-button hero-release-pill">
      <a href={href}><span className="release-version">Android v1.0.2</span><span>See what’s new <span aria-hidden="true">↗</span></span></a>
    </LiquidButton>,
  )
}

// Keep the original anchors and theme button so their native behavior/listeners survive.
document.querySelectorAll<HTMLElement>(".site-header nav > a, .site-header .theme-toggle").forEach((control, index) => {
  const optics = document.createElement("span")
  optics.className = "nav-glass-optics"
  optics.setAttribute("aria-hidden", "true")
  control.prepend(optics)
  createRoot(optics, { identifierPrefix: `nav-${index}-` }).render(<LiquidGlassSurface />)
})
