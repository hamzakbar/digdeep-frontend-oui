import { useState, useEffect, useRef } from 'react'

export function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Set initial size
    setSize({
      width: element.offsetWidth,
      height: element.offsetHeight,
    })

    const observer = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) || !entries.length) return
      const rect = entries[0].contentRect
      setSize({ width: rect.width, height: rect.height })
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, []) // Empty dependency array means this runs once on mount

  return [ref, size.width, size.height] as const
}
