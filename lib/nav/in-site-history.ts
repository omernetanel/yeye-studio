/**
 * How many steps deep in THIS SITE the reader is, counted by the site itself.
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
 * So the count is kept here instead: every route change the app performs adds
 * one, every back or forward takes one away, and the number lives in
 * sessionStorage - per tab, and gone when that tab closes. A reader who leaves
 * and comes back another time starts at zero, which is exactly right.
 */

const KEY = "yeye-nav-depth";

function read(): number {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const value = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    // Private windows and blocked storage both throw. Zero is the safe answer:
    // the control stays a plain link.
    return 0;
  }
}

function write(depth: number) {
  try {
    window.sessionStorage.setItem(KEY, String(depth));
  } catch {
    // Nothing to do: the control falls back to the link for this visit.
  }
}

/** A route change the app made: one step further from where the reader entered. */
export function noteForwardNavigation() {
  write(read() + 1);
}

/** A back or forward step: one step nearer to it, and never past it. */
export function noteHistoryNavigation() {
  write(Math.max(0, read() - 1));
}

/** Whether going back would land on a page of this site rather than leave it. */
export function hasInSiteHistory() {
  return read() > 0;
}
