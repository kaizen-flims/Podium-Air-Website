"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

/** The supplied wave shader, contained within its hero rather than the viewport. */
export function WebGLShader({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playbackRef = useRef<((paused: boolean) => void) | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" })
    } catch {
      canvas.hidden = true
      return // The static hero, text and download link remain usable.
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000)
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const uniforms = {
      resolution: { value: new THREE.Vector2() }, time: { value: 0 },
      xScale: { value: 1 }, yScale: { value: 0.5 }, distortion: { value: 0.05 },
    }
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.RawShaderMaterial({
      uniforms,
      vertexShader: `attribute vec3 position;
        void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `precision highp float;
        uniform vec2 resolution;
        uniform float time;
        uniform float xScale;
        uniform float yScale;
        uniform float distortion;
        void main() {
          vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
          float d = length(p) * distortion;
          float rx = p.x * (1.0 + d);
          float gx = p.x;
          float bx = p.x * (1.0 - d);
          float r = 0.05 / max(0.0001, abs(p.y + sin((rx + time) * xScale) * yScale));
          float g = 0.05 / max(0.0001, abs(p.y + sin((gx + time) * xScale) * yScale));
          float b = 0.05 / max(0.0001, abs(p.y + sin((bx + time) * xScale) * yScale));
          gl_FragColor = vec4(r, g, b, 1.0);
        }`,
    })
    scene.add(new THREE.Mesh(geometry, material))
    let visible = false
    let manuallyPaused = false
    let failed = false
    let previous = 0
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const draw = () => renderer.render(scene, camera)
    const update = () => {
      const playing = visible && !manuallyPaused && !preference.matches && !document.hidden && !window.podiumIntro?.active && !failed
      canvas.dataset.animating = String(playing)
      previous = performance.now()
      renderer.setAnimationLoop(playing ? (now: number) => {
        uniforms.time.value += Math.min((now - previous) / 1000, 0.1) * 0.6
        previous = now
        draw()
      } : null)
      if (!failed) draw()
    }
    playbackRef.current = value => { manuallyPaused = value; update() }
    const resize = () => {
      renderer.setSize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight), false)
      // gl_FragCoord uses physical pixels, including the renderer's pixel ratio.
      renderer.getDrawingBufferSize(uniforms.resolution.value)
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
    intersection.observe(canvas)
    const lost = (event: Event) => { event.preventDefault(); failed = true; update(); canvas.hidden = true }
    canvas.addEventListener('webglcontextlost', lost)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('podium-intro-finished', update)
    preference.addEventListener('change', update)
    resize()
    return () => {
      playbackRef.current = null
      observer.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('podium-intro-finished', update)
      preference.removeEventListener('change', update)
      canvas.removeEventListener('webglcontextlost', lost)
      renderer.setAnimationLoop(null)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }, [])

  useEffect(() => { playbackRef.current?.(paused) }, [paused])
  return <canvas ref={canvasRef} className="hero-wave-canvas absolute inset-0 block h-full w-full pointer-events-none" aria-hidden="true" />
}
