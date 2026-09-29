/**
 * WHERE A PINNED SECTION IS WHOLE, as the section itself reports it.
 *
 * A menu link used to land on a fixed fraction of its section, and a fraction
 * of a pinned run has nothing to do with when that run is showing what the
 * link promises: "מי אני" at 0.42 was the three claims still arriving, one of
 * them barely in. Only the section knows its own beats, so it says where it is
 * complete - in page pixels, measured when asked - and the menu goes there.
 *
 * A section registers while it is mounted and unregisters when it goes, so a
 * desktop and a phone version of the same section can each report their own.
 */

type Landing = () => number | null;

const landings = new Map<string, Landing>();

export function registerLanding(key: string, landing: Landing) {
  landings.set(key, landing);
  return () => {
    if (landings.get(key) === landing) landings.delete(key);
  };
}

/** The page scroll position at which `key` is whole, or null if nothing reports it. */
export function landingFor(key: string) {
  return landings.get(key)?.() ?? null;
}
