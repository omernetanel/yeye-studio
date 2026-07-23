import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { projects } from "@/lib/projects";
import ProjectCard from "@/components/ui/ProjectCard";

export const metadata: Metadata = {
  title: "כל הפרויקטים | YEYE LABS",
  description: "עבודות נבחרות שבניתי עבור לקוחות ועסקים מובילים.",
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-background">
      <ScrollToTop />
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pt-[140px] pb-20">
        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
          כל הפרויקטים
        </h1>
        <p className="mb-16 font-body text-[17px] text-white/50">עבודות נבחרות שבניתי עבור לקוחות ועסקים מובילים.</p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              title={project.title}
              category={project.category}
              imageSrc={project.image}
              href={`/projects/${project.slug}`}
            />
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
