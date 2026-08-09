"use client"

import { useLayoutEffect, useRef, useState } from "react"
import {cn} from "@/lib/utils";

interface HeadEllipsisProps {
  text: string
  className?: string
}

export function HeadEllipsis({ text, className }: HeadEllipsisProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  const [displayText, setDisplayText] = useState(text)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const update = () => {
      const availableWidth = container.getBoundingClientRect().width;
      if (availableWidth <= 0) return

      measure.textContent = text
      if (measure.scrollWidth <= availableWidth) {
        setDisplayText(text)
        return
      }

      measure.textContent = "..."
      const ellipsisWidth = measure.scrollWidth

      let left = 0
      let right = text.length

      while (left < right) {
        const mid = Math.floor((left + right) / 2)

        measure.textContent = text.slice(mid)
        const width = measure.scrollWidth

        if (width + ellipsisWidth <= availableWidth) {
          right = mid
        } else {
          left = mid + 1
        }
      }

      setDisplayText("..." + text.slice(left))
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(container)

    return () => observer.disconnect()
  }, [text])

  return (
    <div ref={containerRef} className="relative min-w-0 w-full overflow-hidden">
      <span className="block overflow-hidden whitespace-nowrap">
          {displayText}
      </span>

      <span
        ref={measureRef}
        className="absolute invisible whitespace-nowrap"
      />
    </div>
  )
}