import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import { projectLink, projects } from "@/lib/projects";
import ProjectCard from "@/components/ui/ProjectCard";

export const metadata: Metadata = pageMetadata({
  label: "פרויקטים",
  description: "עבודה מלאה שבניתי כדי להראות איך אני חושב ובונה.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <main id="main" className="min-h-screen bg-white">
      <Navbar />
      {/* See the project page: this list was a dead end too. */}
      <SubPageNav />
      <div className="mx-auto max-w-[1200px] px-6 pt-[140px] pb-20">
        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight text-black md:text-5xl">
          הפרויקטים שלי
        </h1>
        <p className="mb-16 font-body text-[17px] text-black/70">עבודה מלאה שבניתי כדי להראות איך אני חושב ובונה.</p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              title={project.cardTitle ?? project.title}
              category={project.cardCategory ?? project.category}
              imageSrc={project.image}
              href={projectLink(project).href}
              external={projectLink(project).external}
            />
          ))}
        </div>
      </div>
      <Footer light />
    </main>
  );
}
