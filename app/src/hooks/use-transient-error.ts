import { useEffect, useState } from "react";

/**
 * Pass an error through for `ms` after it appears, then report null — command
 * errors ("fetch failed", "vehicle busy") otherwise sit on the cards forever,
 * since a mutation's error state only clears on the next mutate. A new error
 * (new object identity) restarts the window.
 */
export function useTransientError(
  error: Error | null,
  ms = 10_000,
): Error | null {
  // The specific error instance the timer has expired; identity-compared so a
  // new error shows even if its message matches the hidden one.
  const [expired, setExpired] = useState<Error | null>(null);
  useEffect(() => {
    if (error === null) return;
    const id = setTimeout(() => {
      setExpired(error);
    }, ms);
    return () => {
      clearTimeout(id);
    };
  }, [error, ms]);
  return error !== null && error === expired ? null : error;
}
