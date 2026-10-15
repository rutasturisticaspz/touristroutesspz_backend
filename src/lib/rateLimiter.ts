const MAX_KEYS_IN_MEMORY = 5_000;

// Allows at most `max` events per key within a sliding window.
// It lives in memory: it is enough to stop someone from using a public
// endpoint to flood one mailbox, and it resets when the server restarts.
export function createRateLimiter(max: number, windowMs: number) {
  const records = new Map<string, number[]>();

  const recentOf = (key: string, now: number): number[] =>
    (records.get(key) ?? []).filter((moment) => now - moment < windowMs);

  const dropExpired = (now: number): void => {
    for (const key of records.keys()) {
      if (recentOf(key, now).length === 0) records.delete(key);
    }
  };

  // Returns true if the event is allowed, and counts it.
  return (key: string): boolean => {
    const now = Date.now();
    const recent = recentOf(key, now);

    if (recent.length >= max) {
      records.set(key, recent);
      return false;
    }

    records.set(key, [...recent, now]);
    if (records.size > MAX_KEYS_IN_MEMORY) dropExpired(now);
    return true;
  };
}
