"use client";

import { useSyncExternalStore } from "react";

/**
 * "Back to where you came from", for the 404 page: the way out someone who
 * followed a broken link actually wants. It goes back one step in the tab's
 * history - to a page of this site or to the one that linked here.
 *
 * Nothing to go back to (the address was typed or opened in a new tab), and it
 * is not shown at all: a link that does nothing is worse than none. Read after
 * hydration - the server snapshot is false - so the markup that arrives never
 * offers it and then takes it away.
 */
export default function BackToPreviousLink({ className }: { className?: string }) {
  const canGoBack = useSyncExternalStore(
    () => () => {},
    () => window.history.length > 1,
    () => false,
  );

  if (!canGoBack) return null;

  return (
    <button type="button" onClick={() => window.history.back()} className={className}>
      חזרה לעמוד ממנו הגעת
    </button>
  );
}
