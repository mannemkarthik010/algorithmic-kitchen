"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

/**
 * shadcn/ui Slider, customised: one thumb per value so it works as a range, thumb labels for assistive tech,
 * and the site's copper and graphite instead of the default primary.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { thumbLabels?: string[] }
>(({ className, thumbLabels, ...props }, ref) => {
  const values = props.value ?? props.defaultValue ?? [0]
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center py-3", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-[rgba(242,239,232,0.16)]">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={thumbLabels?.[i]}
          className="block h-[18px] w-[18px] rounded-full border-2 border-primary bg-background shadow-[0_0_0_4px_rgba(216,123,85,0.12)] transition-shadow hover:shadow-[0_0_0_6px_rgba(216,123,85,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
