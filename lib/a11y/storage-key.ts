/**
 * Where the reader's accessibility switches are remembered.
 *
 * In its own module, with no "use client" on it, because the root layout — a
 * server component — writes the pre-paint script that reads this key. A value
 * imported from a client module into a server one arrives as a client
 * reference rather than as the string itself, and the script ends up reading a
 * key that does not exist. That is exactly what happened once.
 */
export const A11Y_STORAGE_KEY = "yeye-a11y";
