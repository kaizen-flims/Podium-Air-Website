"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

/** Decorative, noninteractive rendering of the supplied shader. */
export function ShaderAnimation({ onUnavailable }: { onUnavailable?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" })
    } catch {
      // WebGL can be disabled on older devices. Never block the website.
      queueMicrotask(() => onUnavailable?.())
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    const camera = new THREE.Camera()
    camera.position.z = 1
    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
    }
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform vec2 resolution;
        uniform float time;
        void main(void) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          float t = time * 0.05;
          float lineWidth = 0.002;
          vec3 color = vec3(0.0);
          for(int j = 0; j < 3; j++) {
            for(int i = 0; i < 5; i++) {
              color[j] += lineWidth * float(i*i) / max(0.0001, abs(fract(t - 0.01*float(j) + float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2)));
            }
          }
          gl_FragColor = vec4(color[0], color[1], color[2], 1.0);
        }
      `,
    })
    scene.add(new THREE.Mesh(geometry, material))
    container.appendChild(renderer.domElement)

    const resize = () => {
      renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight))
      renderer.getDrawingBufferSize(uniforms.resolution.value)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    const started = performance.now()
    renderer.setAnimationLoop(() => {
      // Preserve the supplied animation speed at every display refresh rate.
      uniforms.time.value = 1 + (performance.now() - started) * 0.003
      renderer.render(scene, camera)
    })
    const lost = (event: Event) => {
      event.preventDefault()
      onUnavailable?.()
    }
    renderer.domElement.addEventListener("webglcontextlost", lost)
    return () => {
      observer.disconnect()
      renderer.setAnimationLoop(null)
      renderer.domElement.removeEventListener("webglcontextlost", lost)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onUnavailable])

  return <div ref={containerRef} className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden bg-black" aria-hidden="true" />
}
