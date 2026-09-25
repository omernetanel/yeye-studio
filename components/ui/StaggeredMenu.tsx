"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * The navigation panel, dealt onto the page rather than dropped down.
 *
 * This is React Bits' StaggeredMenu (MIT), and the timeline is theirs, not a
 * lookalike: two under-layers slide in 0.07s apart on power4.out, the panel
 * follows 0.08s after the last of them over 0.65s, the labels ride up from
 * yPercent 140 with a 10-degree lean on a 0.1s stagger, and the numerals fade
 * in behind them. Those numbers are the component.
 *
 * WHAT IS OURS is everything around it. Their version owns its own toggle, a
 * logo, a text cycle and a row of social links; this one owns none of those.
 * The four-square button in NavMenu stays exactly as it was and simply hands
 * this an `open` flag, and an item runs a scroll target rather than following
 * an href — the sections here are pinned runs, so a link would land on the
 * frame that means nothing (see NavMenu).
 *
 * GSAP RATHER THAN FRAMER MOTION, against the grain of the rest of the site's
 * UI, because this is their timeline and rewriting it in another library is how
 * a good animation becomes an approximation. gsap is already a dependency, and
 * the rule it must not break — never two engines on one element — holds: no
 * framer-motion touches anything in here.
 *
 * The styles live in globals.css with the rest of the site's own CSS, under the
 * same `sm-` names the source uses.
 */

export type StaggeredMenuItem = {
  label: string;
  ariaLabel?: string;
  onSelect: () => void;
};

export default function StaggeredMenu({
  open,
  position = "right",
  items,
  footer,
  onPointerEnter,
  onPointerLeave,
}: {
  open: boolean;
  position?: "left" | "right";
  items: StaggeredMenuItem[];
  /** Sits under the list, at the foot of the panel — the page's own CTA. */
  footer?: React.ReactNode;
  /** The button opens this on hover, so the panel has to count as the same
   *  surface: a pointer crossing from one to the other must not close it. */
  onPointerEnter?: React.PointerEventHandler;
  onPointerLeave?: React.PointerEventHandler;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  const offscreen = position === "left" ? -100 : 100;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      if (!panel) return;

      const preLayers = preContainer
        ? (Array.from(preContainer.querySelectorAll(".sm-prelayer")) as HTMLElement[])
        : [];
      preLayerElsRef.current = preLayers;

      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });
    });
    return () => ctx.revert();
  }, [offscreen]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }

    const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"),
    ) as HTMLElement[];
    const footerEl = panel.querySelector(".sm-panel-footer") as HTMLElement | null;

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { "--sm-num-opacity": 0 });
    if (footerEl) gsap.set(footerEl, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layers.forEach((layer, i) => {
      tl.fromTo(layer, { xPercent: offscreen }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, i * 0.07);
    });
    const lastTime = layers.length ? (layers.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layers.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: offscreen },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime,
    );

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 1, ease: "power4.out", stagger: { each: 0.1, from: "start" } },
        itemsStart,
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: "power2.out",
            "--sm-num-opacity": 1,
            stagger: { each: 0.08, from: "start" },
          },
          itemsStart + 0.1,
        );
      }
    }

    if (footerEl) {
      tl.to(
        footerEl,
        { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
        panelInsertTime + panelDuration * 0.4,
      );
    }

    openTlRef.current = tl;
    return tl;
  }, [offscreen]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (!tl) {
      busyRef.current = false;
      return;
    }
    tl.eventCallback("onComplete", () => {
      busyRef.current = false;
    });
    tl.play(0);
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;

    const panel = panelRef.current;
    if (!panel) return;

    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...preLayerElsRef.current, panel], {
      xPercent: offscreen,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        // Put every part back where the open timeline expects to find it, so
        // the second opening looks exactly like the first.
        const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        const numberEls = Array.from(
          panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"),
        ) as HTMLElement[];
        if (numberEls.length) gsap.set(numberEls, { "--sm-num-opacity": 0 });
        const footerEl = panel.querySelector(".sm-panel-footer") as HTMLElement | null;
        if (footerEl) gsap.set(footerEl, { y: 25, opacity: 0 });
        busyRef.current = false;
      },
    });
  }, [offscreen]);

  // The button owns the state; this only plays what the flag says. Skipped on
  // the very first render, or the panel would slam shut on a page that never
  // opened it.
  const playedRef = useRef(false);
  useEffect(() => {
    if (!playedRef.current) {
      playedRef.current = true;
      if (!open) return;
    }
    if (open) playOpen();
    else playClose();
  }, [open, playOpen, playClose]);

  return (
    <div className="sm-root" data-position={position} data-open={open || undefined}>
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {/* Two of them, a shade apart: one rectangle arriving is a drawer,
            three edges in sequence is the panel being dealt onto the page. */}
        <div className="sm-prelayer" style={{ background: "#d9d9d9" }} />
        <div className="sm-prelayer" style={{ background: "#8f8f8f" }} />
      </div>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        className="staggered-menu-panel"
        aria-hidden={!open}
        aria-label="ניווט"
        // On the panel, not on the root: the root spans the screen, and a
        // pointerleave that can never fire is a menu that will not close.
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list" data-numbering>
            {items.map((item) => (
              <li className="sm-panel-itemWrap" key={item.label}>
                <button
                  type="button"
                  className="sm-panel-item"
                  aria-label={item.ariaLabel ?? item.label}
                  tabIndex={open ? 0 : -1}
                  onClick={item.onSelect}
                >
                  <span className="sm-panel-itemLabel">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {footer && <div className="sm-panel-footer">{footer}</div>}
        </div>
      </aside>
    </div>
  );
}
