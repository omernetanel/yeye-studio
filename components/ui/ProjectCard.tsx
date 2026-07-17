import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  title: string;
  category: string;
  imageSrc: string;
  href: string;
}

export default function ProjectCard({ title, category, imageSrc, href }: ProjectCardProps) {
  return (
    <Link href={href} className="group block transition-transform duration-200 ease-out hover:scale-[1.02]">
      <div className="relative mb-3.5 aspect-[1672/941] w-full overflow-hidden rounded-xl border border-white/10 bg-surface">
        <Image src={imageSrc} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-top" />
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-[13px] text-white/42">{category}</span>
        <span className="font-display text-[17px] font-bold text-white">{title}</span>
      </div>
    </Link>
  );
}
