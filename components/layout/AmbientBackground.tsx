/**
 * Shared fixed backdrop (soft accent glow + faint grid) for every
 * white-background page — same values as the homepage's, so the ambient
 * feel is consistent site-wide instead of each page inventing its own.
 */
export default function AmbientBackground() {
  return (
    <>
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
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[size:60px_60px]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in srgb, black 3%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, black 3%, transparent) 1px, transparent 1px)
          `,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
      />
    </>
  );
}
