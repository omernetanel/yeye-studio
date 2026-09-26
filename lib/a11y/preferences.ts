"use client";

import { useSyncExternalStore } from "react";
import { A11Y_STORAGE_KEY } from "@/lib/a11y/storage-key";

/**
 * The reader's own settings, kept by the reader.
 *
 * The site is designed as it is on purpose — a white page, big type, grey
 * captions — and these do not change that for anyone who has not asked. What
 * they do is give the people who need something else a way to get it without
 * leaving: more contrast in the small type, no motion at all, links that
 * announce themselves as links.
 *
 * Held as attributes on <html> so the whole site answers them in CSS, and
 * written to localStorage so a visitor does not have to set them again on
 * every page. That storage is functional, not tracking: nothing is read from
 * it but these three switches, and it never leaves the browser.
 */
export type A11yPrefs = {
  contrast: boolean;
  motion: boolean;
  links: boolean;
};

const DEFAULTS: A11yPrefs = { contrast: false, motion: false, links: false };

let prefs: A11yPrefs = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): A11yPrefs {
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    return {
      contrast: parsed.contrast === true,
      motion: parsed.motion === true,
      links: parsed.links === true,
    };
  } catch {
    // Private windows and blocked storage both throw here. The site works
    // without the memory; it just forgets between visits.
    return DEFAULTS;
  }
}

function apply(next: A11yPrefs) {
  const root = document.documentElement;
  root.toggleAttribute("data-a11y-contrast", next.contrast);
  root.toggleAttribute("data-a11y-motion", next.motion);
  root.toggleAttribute("data-a11y-links", next.links);
}

function publish(next: A11yPrefs) {
  prefs = next;
  apply(next);
  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Nothing to do: the setting still holds for this visit.
  }
  for (const listener of listeners) listener();
}

export function setA11yPref<K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]) {
  publish({ ...prefs, [key]: value });
}

export function resetA11yPrefs() {
  publish(DEFAULTS);
}

function subscribe(listener: () => void) {
  // First subscriber pulls what the last visit left behind. The attributes are
  // already on <html> by then — an inline script in the layout sets them before
  // the first paint — so this only syncs the state React renders from.
  if (!hydrated) {
    hydrated = true;
    prefs = read();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useA11yPrefs() {
  return useSyncExternalStore(
    subscribe,
    () => prefs,
    () => DEFAULTS,
  );
}

/** Whether the reader asked for no motion here, regardless of the OS setting. */
export function motionOffByPreference() {
  return prefs.motion;
}
