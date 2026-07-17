/**
 * Prepares every [data-draw] SVG shape inside a container for a stroke
 * "draw-in" animation: measures its real length and sets up the
 * dasharray/dashoffset trick, without needing GSAP's paid DrawSVG plugin.
 * Works uniformly for circle/line/rect/path since they all implement
 * SVGGeometryElement.
 */
export function prepareDrawPaths(container: SVGSVGElement) {
  const elements = Array.from(container.querySelectorAll<SVGGeometryElement>("[data-draw]"));
  elements.forEach((el) => {
    const length = el.getTotalLength();
    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length}`;
  });
  return elements;
}
