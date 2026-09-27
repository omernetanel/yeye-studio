/**
 * A heading laid out as one line of words, stood up as a stack and settled back.
 *
 * The heading is laid out in its SETTLED form — the words as flex children on
 * one line — and only transforms move it, so nothing around it re-lays out.
 * The words are stacked about (`centreX`, `centreY`) in the heading's own box,
 * and `settle` runs that stack back into the line.
 *
 * `sameSize` picks between two ways to size the stack, and anything between:
 * - 0: every word scaled to `bigWidth`, so the lines are exactly the same
 *   length. A short word comes out bigger than a long one.
 * - 1: one scale for all, the one that brings the longest word to `bigWidth`.
 *   The lines are one type size and a short word stays short.
 * Between, each word's scale is the geometric blend of the two, so the short
 * words grow less and the long one keeps the width.
 *
 * Everything read here is an offset, not a rect, so none of it moves with the
 * transforms this writes.
 */
export function stackHeading(
  heading: HTMLElement,
  centreX: number,
  centreY: number,
  bigWidth: number,
  maxBigHeight: number,
  settle: number,
  sameSize = 0,
) {
  const words = Array.from(heading.children) as HTMLElement[];
  const widest = Math.max(1, ...words.map((word) => word.offsetWidth));
  let scales = words.map(
    (word) => (bigWidth / Math.max(1, word.offsetWidth)) ** (1 - sameSize) * (bigWidth / widest) ** sameSize,
  );
  const height = words.reduce((sum, word, i) => sum + word.offsetHeight * scales[i], 0);
  // Too tall for the room it has: shrink the whole stack evenly, so the lines
  // keep the relation to each other they were given.
  if (height > maxBigHeight) scales = scales.map((s) => (s * maxBigHeight) / height);
  const stackHeight = Math.min(height, maxBigHeight);

  let top = centreY - stackHeight / 2;
  words.forEach((word, i) => {
    const lineHeight = word.offsetHeight * scales[i];
    const bigX = centreX - (word.offsetLeft + word.offsetWidth / 2);
    const bigY = top + lineHeight / 2 - (word.offsetTop + word.offsetHeight / 2);
    top += lineHeight;
    const x = bigX * (1 - settle);
    const y = bigY * (1 - settle);
    const scale = scales[i] + (1 - scales[i]) * settle;
    word.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  });
}
