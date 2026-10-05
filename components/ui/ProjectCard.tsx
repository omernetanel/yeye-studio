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
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group block transition-transform duration-200 ease-out hover:scale-[1.02]"
    >
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
          {external && href.startsWith("http") && (
            <ExternalNote className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap text-white/55" />
          )}
        </div>
      </BorderGlowCard>
    </Link>
  );
}
