"use client";

import { useSyncExternalStore } from "react";

/**
 * Coordinates the Hero logo's scroll-driven "dock into the Navbar" handoff
 * across three components that don't otherwise share a parent: the Hero
 * logo decides when it has arrived, the Navbar needs to know when to reveal
 * its own (otherwise-hidden) logo, and the Services section needs to know
 * when to fade its background to black. `docked` only changes twice per
 * scroll pass (crossing the threshold each way), so it's cheap to model as
 * a rare external-store flip rather than a continuously-updating value —
 * the continuous part of the animation is driven imperatively, not through
 * this store.
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

// The Navbar's own logo element registers itself here so the Hero can read
// its live position/size each scroll tick — it's the interpolation target
// for the floating logo's dock transform. A plain module-level ref (not
// store state) since only the Hero ever reads it, imperatively, per frame.
let navbarLogoEl: HTMLElement | null = null;

export function registerNavbarLogoEl(el: HTMLElement | null) {
  navbarLogoEl = el;
}

export function getNavbarLogoRect(): DOMRect | null {
  return navbarLogoEl ? navbarLogoEl.getBoundingClientRect() : null;
}
