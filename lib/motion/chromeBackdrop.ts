"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the hero is currently painting the page's floating chrome.
 *
 * The menu button has to behave like everything else the ink washes over:
 * black on the paper, white inside the ink, inverting pixel by pixel rather
 * than switching colour once the ink is mostly over it. Only the hero's own
 * shader can do that, so while the hero is on screen it draws a copy of the
 * button onto a layer of its own and composites it (see uChrome in
 * FluidInkReveal) — and the real element makes its type transparent so the two
 * are never both visible.
 *
 * NOT A BLEND, and that is worth writing down because it is the obvious answer:
 * `mix-blend-mode` is not applied over a WebGL canvas on mobile browsers, which
 * is the same reason the hero's own type is painted rather than blended. A
 * blended button came out white on white over the ink on a phone.
 *
 * NOT A COLOUR SWITCH EITHER: reading one pixel under the button and flipping
 * between black and white works, but while the ink covers half the button half
 * of it disappears. The hero does not do that, and nor should this.
 */
let painted = false;
const listeners = new Set<() => void>();

export function setChromePaintedByHero(value: boolean) {
  if (value === painted) return;
  painted = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useChromePaintedByHero() {
  return useSyncExternalStore(
    subscribe,
    () => painted,
    () => false,
  );
}
