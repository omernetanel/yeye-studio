import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { projects } from "@/lib/projects";
import { notFound } from "next/navigation";
import ScrollToTop from "@/components/ui/ScrollToTop";
import ProjectPageClient from "./ProjectPageClient";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <ScrollToTop />
      <Navbar />
      <ProjectPageClient project={project} />
      <Footer />
    </main>
  );
}
