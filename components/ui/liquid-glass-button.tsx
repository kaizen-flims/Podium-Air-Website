"use client"

import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: { default: "h-9 px-4 py-2", sm: "h-8 px-3 text-xs", lg: "h-10 px-8", icon: "h-9 w-9" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  },
)
Button.displayName = "Button"

export const liquidbuttonVariants = cva(
  "liquid-button relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent text-white",
        destructive: "bg-destructive text-white",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent",
        link: "underline-offset-4 hover:underline",
      },
      size: { default: "h-9 px-4", sm: "h-8 px-4 text-xs", lg: "h-10 px-6", xl: "h-12 px-8", xxl: "h-14 px-10", icon: "size-9" },
    },
    defaultVariants: { variant: "default", size: "xxl" },
  },
)

/** Adapted from the supplied liquid button: valid link composition and unique SVG IDs. */
export function LiquidButton({ className, variant, size, asChild = false, children, ...props }:
  React.ComponentProps<"button"> & VariantProps<typeof liquidbuttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(liquidbuttonVariants({ variant, size }), className)} {...props}>
    <LiquidGlassSurface />
    <Slottable>{children}</Slottable>
  </Comp>
}

/** Shared glass optics for buttons and existing navigation controls. */
export function LiquidGlassSurface() {
  const filterId = `glass-${React.useId().replace(/:/g, '')}`
  return <>
    <span className="liquid-glass-surface" aria-hidden="true" style={{ backdropFilter: `url("#${filterId}") blur(4px)` }} />
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="liquid-filter">
      <defs><filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
        <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
        <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
        <feComposite in="finalBlur" in2="finalBlur" operator="over" />
      </filter></defs>
    </svg>
  </>
}
