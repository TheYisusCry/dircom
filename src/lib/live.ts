/** Pure helpers shared by the live UI and its tests. */
export function serverClockOffset(serverNow: number, started: number, ended: number) {
  return serverNow - (started + ended) / 2;
}

export function revelationRemaining(revealAt: string | null | undefined, now: number) {
  return revealAt ? Math.max(0, Date.parse(revealAt) - now) : 0;
}

export function mergeMessages<T extends { id: string; sentAt: string }>(previous: readonly T[], incoming: readonly T[]) {
  const messages = new Map(previous.map((message) => [message.id, message]));
  incoming.forEach((message) => messages.set(message.id, message));
  return [...messages.values()].sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id.localeCompare(b.id));
}
