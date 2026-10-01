import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import AmbientBackground from "@/components/layout/AmbientBackground";
import { projects } from "@/lib/projects";
import ProjectPageClient from "./ProjectPageClient";

export function generateStaticParams() {
  return projects.filter((p) => !p.external).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};

  const meta = pageMetadata({
    label: project.title,
    description: project.description,
    path: `/projects/${project.slug}`,
  });
  // The project's own picture on its share card, instead of the wordmark.
  const images = [project.image];
  return { ...meta, openGraph: { ...meta.openGraph, images }, twitter: { ...meta.twitter, images } };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project || project.external) notFound();

  return (
    <main id="main" className="relative min-h-screen bg-white">
      <AmbientBackground />
      <div className="relative z-10">
        <Navbar />
        {/* The same row the service pages carry. Without it this page had the
            mark and the footer and nothing else: someone landing here from a
            search had no way into the rest of the site. */}
        <SubPageNav />
        <ProjectPageClient project={project} />
        <Footer light />
      </div>
    </main>
  );
}
