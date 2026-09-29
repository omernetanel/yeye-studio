"use client";

import { useEffect } from "react";

// What counts as a picture on this site: photographs, video, and the canvases
// the WebGL pieces draw them into.
const MEDIA = "img, video, canvas";

/**
 * Closes the right-click menu and the drag-out on pictures, by the owner's
 * choice (copyright). The CSS half, the iOS long-press menu, is in
 * globals.css. Text and links keep their menus.
 */
export default function MediaGuard() {
  useEffect(() => {
    const guard = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(MEDIA)) event.preventDefault();
    };
    document.addEventListener("contextmenu", guard);
    document.addEventListener("dragstart", guard);
    return () => {
      document.removeEventListener("contextmenu", guard);
      document.removeEventListener("dragstart", guard);
    };
  }, []);

  return null;
}
