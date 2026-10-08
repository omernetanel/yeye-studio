import Image from "next/image";
import Link from "next/link";
import BorderGlowCard from "./BorderGlowCard";
import ExternalNote from "./ExternalNote";

interface ProjectCardProps {
  title: string;
  category: string;
  imageSrc: string;
  href: string;
  /** Links straight out to an external site instead of an internal page — opens in a new tab. */
  external?: boolean;
}

export default function ProjectCard({ title, category, imageSrc, href, external }: ProjectCardProps) {
  // A piece can be marked external and still point at an address on this
  // site. Only one that really goes elsewhere opens a new tab and says so.
  const leavesSite = Boolean(external) && href.startsWith("http");
  const opens = leavesSite || !external;
  const card = (
    <>
      {/* The benefit cards from the home page, with the screenshot inside. */}
      <BorderGlowCard className="p-3">
        <div className="relative mb-3.5 aspect-[1672/941] w-full overflow-hidden rounded-[14px] bg-white/[0.04]">
          <Image src={imageSrc} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain" />
        </div>
        <div className="relative flex items-center justify-between px-2 pb-1.5">
          <span className="font-display text-[13px] text-white/75">{category}</span>
          <span className="font-display text-[17px] font-bold text-white">{title}</span>
          {/* Under the picture, in the gap above this row, and out of the flow,
              so a card that leaves the site is the same height as one that
              does not. */}
          {(leavesSite || !external) && (
            <ExternalNote
              inSite={!external}
              className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap text-white/55"
            />
          )}
        </div>
      </BorderGlowCard>
    </>
  );
  // A piece with nowhere to open - marked external, with no live address - is
  // a card and not a link: pressed, it led to a page that does not exist.
  if (!opens) return <div>{card}</div>;
  return (
    <Link
      href={href}
      target={leavesSite ? "_blank" : undefined}
      rel={leavesSite ? "noopener noreferrer" : undefined}
      className="group block transition-transform duration-200 ease-out hover:scale-[1.02]"
    >
      {card}
    </Link>
  );
}
