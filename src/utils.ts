/**
 * Shared utility functions for chartgpu-react.
 */

/**
 * Debounce utility for throttling frequent calls.
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}
