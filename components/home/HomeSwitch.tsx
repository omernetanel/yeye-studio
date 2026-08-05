"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "@/lib/use-mobile";

/**
 * The one place the page decides which version it is.
 *
 * Every pinned section used to make that call for itself, which meant six
 * independent branches that could each drift. Deciding once, here, lets the
 * mobile tree be a design of its own rather than the desktop tree with
 * exceptions threaded through it.
 */
export default function HomeSwitch({
  children,
  mobile,
}: {
  children: ReactNode;
  mobile: ReactNode;
}) {
  const isMobile = useIsMobile();
  return <>{isMobile ? mobile : children}</>;
}
