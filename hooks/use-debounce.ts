"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook to debounce a value.
 *
 * @param value The value to debounce.
 * @param delay The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup function:
    // This is important. If the value changes before the timeout,
    // the previous timeout is cleared, and a new one is set.
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay]) // Only re-run if value or delay changes

  return debouncedValue
}
