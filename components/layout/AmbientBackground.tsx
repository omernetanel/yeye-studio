/**
 * Shared fixed backdrop (soft accent glow) for every white-background
 * page — same values as the homepage's, so the ambient feel is
 * consistent site-wide instead of each page inventing its own.
 */
export default function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 70% 5%, color-mix(in srgb, var(--color-accent) 2.5%, transparent) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 20% 40%, color-mix(in srgb, var(--color-accent-light) 2%, transparent) 0%, transparent 55%),
          radial-gradient(ellipse 70% 40% at 50% 80%, color-mix(in srgb, var(--color-accent) 1.5%, transparent) 0%, transparent 60%)
        `,
      }}
    />
  );
}
