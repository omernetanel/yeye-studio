/**
 * The trail of routes the reader has walked IN THIS SITE, kept by the site.
 *
 * The question a back control has to answer is "is the previous history entry
 * one of mine?", and the browser does not expose that. The two obvious stand-ins
 * both lie:
 *
 * - `history.length` counts entries from other sites too, so a reader who came
 *   from a search result looks the same as one who came from the home page.
 * - `document.referrer` is the referrer of the DOCUMENT, not of the previous
 *   route. Someone who arrived from Google and then moved around the site
 *   client-side still reads as "came from Google" at every stop.
 *
 * So the trail is kept here instead, in sessionStorage - per tab, and gone when
 * that tab closes, so a reader who leaves and returns another time starts from
 * nothing, which is exactly right.
 *
 * A TRAIL RATHER THAN A COUNT, and the difference is the forward button. Both
 * directions arrive as the same popstate event, so a bare counter took one off
 * for each and a reader who pressed back and then forward was left shallower
 * than they really were - with the control degraded to a plain link while there
 * was still somewhere of ours to go back to. Comparing the new path against the
 * trail says which direction it was without having to be told.
 */

const KEY = "yeye-nav-trail";

// Deep enough for any real journey through a site of a dozen pages, and short
// enough that it stays a few hundred bytes however long someone wanders.
const MAX = 20;

function read(): string[] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    // Private windows, blocked storage and anything malformed all land here.
    // An empty trail is the safe answer: the control stays a plain link.
    return [];
  }
}

function write(trail: string[]) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(trail.slice(-MAX)));
  } catch {
    // Nothing to do: the control falls back to the link for this visit.
  }
}

/** The page the reader entered on. Only ever starts a trail, never adds to one. */
export function noteArrival(path: string) {
  if (read().length === 0) write([path]);
}

/** A route change the app made: one step further from where they entered. */
export function noteForwardNavigation(path: string) {
  write([...read(), path]);
}

/**
 * A back or forward step. Back if the path is the one behind the current
 * position in the trail, forward otherwise.
 */
export function noteHistoryNavigation(path: string) {
  const trail = read();
  if (trail.length >= 2 && trail[trail.length - 2] === path) write(trail.slice(0, -1));
  else write([...trail, path]);
}

/** Whether going back would land on a page of this site rather than leave it. */
export function hasInSiteHistory() {
  return read().length > 1;
}
