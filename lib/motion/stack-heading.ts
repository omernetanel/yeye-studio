/**
 * A heading laid out as one line of words, stood up as a stack of equal-width
 * lines and settled back.
 *
 * The heading is laid out in its SETTLED form — the words as flex children on
 * one line — and only transforms move it, so nothing around it re-lays out.
 * Every word is scaled to `bigWidth`, which is what makes the lines exactly the
 * same length, and stacked about (`centreX`, `centreY`) in the heading's own
 * box. `settle` runs that stack back into the line.
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
) {
  const words = Array.from(heading.children) as HTMLElement[];
  let scales = words.map((word) => bigWidth / Math.max(1, word.offsetWidth));
  const height = words.reduce((sum, word, i) => sum + word.offsetHeight * scales[i], 0);
  // Too tall for the room it has: shrink the whole stack evenly, so the lines
  // stay the same length as each other.
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
