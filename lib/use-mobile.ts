"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT_PX = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

function subscribe(callback: () => void) {
  const mediaQueryList = window.matchMedia(QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * What the server guessed from the user agent, for the render that happens
 * before any media query can run.
 *
 * Pages that do not provide it keep the old behaviour of assuming desktop.
 */
export const ServerDeviceContext = createContext(false);

/** True below the mobile breakpoint — used to decide whether to mount heavy WebGL scenes. */
export function useIsMobile() {
  const serverGuess = useContext(ServerDeviceContext);
  return useSyncExternalStore(subscribe, getSnapshot, () => serverGuess);
}
