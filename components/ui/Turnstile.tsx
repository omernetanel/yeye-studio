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
 * NOTHING TO SEE, almost always. It runs in the background from the moment
 * the page has loaded, and only a visitor Cloudflare is unsure of is shown a box to
 * tick, here, under the fields. Its box is never hidden: hidden, it was never
 * rendered into, and every send was refused as a bot's.
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
  // The check could not run at all - its script did not load, or Cloudflare
  // reported an error. A send then fails at once rather than after the wait.
  const failedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    failedRef.current = false;
    // One list for the life of the form: emptied in place, never replaced.
    const waiters = waitersRef.current;

    const settle = (token: string | null) => {
      tokenRef.current = token;
      if (token === null) return;
      failedRef.current = false;
      for (const resolve of waiters.splice(0)) resolve(token);
    };
    const fail = () => {
      tokenRef.current = null;
      failedRef.current = true;
      for (const resolve of waiters.splice(0)) resolve(null);
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
            // Expired: refreshed by itself (refresh-expired), so it is only
            // waited for.
            "expired-callback": () => settle(null),
            "error-callback": () => fail(),
          });
        })
        // Blocked or failed: the form says so, and points to WhatsApp.
        .catch(() => {
          if (!cancelled) fail();
        });
    };

    // WITH THE PAGE, as soon as it has loaded. It used to wait for the form to
    // come near the screen; a check that starts with the page is one that is
    // always done by the time anyone presses send. Not before the load: its
    // challenge is over a megabyte, and the hero's clip comes first.
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      if (widgetRef.current !== null) apiRef.current?.remove(widgetRef.current);
      widgetRef.current = null;
      for (const resolve of waiters.splice(0)) resolve(null);
    };
  }, [theme]);

  useImperativeHandle(ref, () => ({
    token: () => {
      if (tokenRef.current) return Promise.resolve(tokenRef.current);
      if (failedRef.current) return Promise.resolve(null);
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
    // A fresh check on the same widget. With no widget - the script never
    // loaded - there is nothing to reset, and the failure stands.
    reset: () => {
      if (widgetRef.current === null) return;
      tokenRef.current = null;
      failedRef.current = false;
      apiRef.current?.reset(widgetRef.current);
    },
  }));

  return <div ref={containerRef} className={className} />;
});

export default Turnstile;
