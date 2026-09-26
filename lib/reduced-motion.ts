"use client";

import { useSyncExternalStore } from "react";
import { motionOffByPreference, useA11yPrefs } from "@/lib/a11y/preferences";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mediaQueryList = window.matchMedia(QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches || motionOffByPreference();
}

function getServerSnapshot() {
  return false;
}

/**
 * Whether this reader wants less motion — from the operating system, or from
 * the site's own accessibility panel.
 *
 * Both sources are read here rather than in every section: the panel's switch
 * has to reach the same code the OS setting reaches, or it would turn off the
 * small fades and leave the pinned sections running.
 */
export function usePrefersReducedMotion() {
  const system = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Subscribing to the panel as well is what re-renders a section the moment
  // the switch is flipped; the value itself is already folded into getSnapshot.
  const chosen = useA11yPrefs().motion;
  return system || chosen;
}
