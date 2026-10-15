import gsap from "gsap";

// GSAP alone, for the menu's timeline (StaggeredMenu) and the ticker the
// smooth scroll runs on (lenis.tsx). ScrollTrigger was registered here for
// years after the last pinned section stopped using it - every section pins
// by hand now (see CONTEXT) - and every page downloaded it for nothing.
export { gsap };
