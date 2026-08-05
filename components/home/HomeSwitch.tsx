"use client";

import type { ReactNode } from "react";
import { ServerDeviceContext, useIsMobile } from "@/lib/use-mobile";

/**
 * The one place the page decides which version it is.
 *
 * Every pinned section used to make that call for itself, which meant six
 * independent branches that could each drift. Deciding once, here, lets the
 * mobile tree be a design of its own rather than the desktop tree with
 * exceptions threaded through it.
 *
 * The server's guess is published to the whole tree so that the sections
 * underneath render the same branch this one picked. Without it they would
 * each assume desktop during the server render, and a phone would be sent
 * desktop markup — and start fetching desktop media — inside the mobile tree.
 */
export default function HomeSwitch({
  children,
  mobile,
  serverIsMobile,
}: {
  children: ReactNode;
  mobile: ReactNode;
  serverIsMobile: boolean;
}) {
  return (
    <ServerDeviceContext.Provider value={serverIsMobile}>
      <PickTree mobile={mobile}>{children}</PickTree>
    </ServerDeviceContext.Provider>
  );
}

/** Sits below the provider so that it reads the same guess everything else does. */
function PickTree({ children, mobile }: { children: ReactNode; mobile: ReactNode }) {
  const isMobile = useIsMobile();
  return <>{isMobile ? mobile : children}</>;
}
