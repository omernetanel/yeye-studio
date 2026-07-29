"use client";

import { useSyncExternalStore } from "react";

/**
 * Coordinates the Hero pin's release with the Navbar, which don't otherwise
 * share a parent: the Hero decides the instant its pin lets go, the Navbar
 * needs to know right then so it can reveal its own (otherwise-hidden)
 * logo. `docked` only changes twice per scroll pass (crossing the
 * threshold each way), so it's cheap to model as a rare external-store
 * flip rather than a continuously-updating value.
 */
let docked = false;
const listeners = new Set<() => void>();

export function setDocked(value: boolean) {
  if (docked === value) return;
  docked = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return docked;
}

function getServerSnapshot() {
  return false;
}

export function useDocked() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
