/**
 * A first guess at the device, made on the server from the user agent.
 *
 * The client decides for real with a media query — this only picks which tree
 * gets sent in the HTML. Without it the server always sends the desktop page,
 * and a phone starts fetching desktop-only media before the swap happens.
 *
 * Tablets are deliberately not matched: the breakpoint that actually governs
 * the layout is 768px, which they sit above, so calling them mobile here would
 * send the wrong tree and then visibly correct itself.
 */
const MOBILE_USER_AGENT = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function isMobileUserAgent(userAgent: string | null) {
  return userAgent !== null && MOBILE_USER_AGENT.test(userAgent);
}
