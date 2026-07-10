/** Jittered artificial latency so mock services produce honest loading states. */
export function delay(ms?: number): Promise<void> {
  const wait = ms ?? 300 + Math.random() * 400
  return new Promise((resolve) => setTimeout(resolve, wait))
}
