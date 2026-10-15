"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/site";

/**
 * THE FORMS' CHECK THAT A PERSON IS SENDING THEM - Cloudflare Turnstile.
 *
 * Without it, anything that could post to /api/contact could have the site
 * mail its receipt to any address it liked: the studio's name on mail to
 * strangers, and the domain's reputation spent on it. The server now refuses
 * a send that does not carry a token this produced (app/api/contact/route.ts).
 *
 * NOTHING TO SEE, almost always. It runs in the background once the form is
 * near the screen, and only a visitor Cloudflare is unsure of is shown a box
 * to tick, here, under the fields. The script is fetched only then, so a
 * reader who never reaches a form never downloads it.
 *
 * A token is good for one send. The form asks for one when it is sent - and
 * waits a moment for it if the check is still running - and resets the check
 * afterwards, so a second try has a fresh one.
 */

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widget: string) => void;
  remove: (widget: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// Begin when the form is this close to the screen.
const START_MARGIN = "600px 0px";
// How long a send waits for a check still under way.
const TOKEN_WAIT_MS = 8000;

let loading: Promise<TurnstileApi> | null = null;

/** The Turnstile script, once for the page however many forms ask for it. */
function loadTurnstile() {
  if (!loading) {
    loading = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
      script.onerror = () => {
        // A blocked or failed load may succeed on the next attempt.
        loading = null;
        reject(new Error("turnstile failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export type TurnstileHandle = {
  /** The token for this send, waiting a moment if the check is still running; null if there is none. */
  token: () => Promise<string | null>;
  /** A fresh check, after a send has used the token. */
  reset: () => void;
};

const Turnstile = forwardRef<TurnstileHandle, { theme: "light" | "dark"; className?: string }>(function Turnstile(
  { theme, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const apiRef = useRef<TurnstileApi | null>(null);
  const tokenRef = useRef<string | null>(null);
  const waitersRef = useRef<((token: string | null) => void)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    // One list for the life of the form: emptied in place, never replaced.
    const waiters = waitersRef.current;

    const settle = (token: string | null) => {
      tokenRef.current = token;
      if (token === null) return;
      for (const resolve of waiters.splice(0)) resolve(token);
    };

    const start = () => {
      loadTurnstile()
        .then((api) => {
          if (cancelled || widgetRef.current !== null) return;
          apiRef.current = api;
          widgetRef.current = api.render(container, {
            sitekey: TURNSTILE_SITE_KEY,
            theme,
            language: "he",
            size: "flexible",
            // Shown only when a visitor has to tick it.
            appearance: "interaction-only",
            "refresh-expired": "auto",
            callback: (token: string) => settle(token),
            "expired-callback": () => settle(null),
            "error-callback": () => settle(null),
          });
        })
        .catch(() => {
          // The send itself reports it: the server refuses a send with no
          // token, and the form says so and points to WhatsApp.
        });
    };

    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watch.disconnect();
        start();
      },
      { rootMargin: START_MARGIN },
    );
    watch.observe(container);

    return () => {
      cancelled = true;
      watch.disconnect();
      if (widgetRef.current !== null) apiRef.current?.remove(widgetRef.current);
      widgetRef.current = null;
      for (const resolve of waiters.splice(0)) resolve(null);
    };
  }, [theme]);

  useImperativeHandle(ref, () => ({
    token: () => {
      if (tokenRef.current) return Promise.resolve(tokenRef.current);
      return new Promise<string | null>((resolve) => {
        waitersRef.current.push(resolve);
        window.setTimeout(() => {
          const at = waitersRef.current.indexOf(resolve);
          if (at === -1) return;
          waitersRef.current.splice(at, 1);
          resolve(null);
        }, TOKEN_WAIT_MS);
      });
    },
    reset: () => {
      tokenRef.current = null;
      if (widgetRef.current !== null) apiRef.current?.reset(widgetRef.current);
    },
  }));

  return <div ref={containerRef} className={className} />;
});

export default Turnstile;
