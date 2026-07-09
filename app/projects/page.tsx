import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { projects } from "@/lib/projects";
import ProjectCard from "@/components/ui/ProjectCard";

export default function ProjectsPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <ScrollToTop />
      <Navbar />
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "140px 24px 80px",
        direction: "rtl",
      }}>
        <h1 style={{
          fontFamily: "'GoogleSans', Arial, sans-serif",
          fontWeight: 700,
          fontSize: "48px",
          color: "white",
          marginBottom: "16px",
          letterSpacing: "-0.02em",
        }}>
          כל הפרויקטים
        </h1>
        <p style={{
          fontFamily: "'Assistant', Arial, sans-serif",
          fontSize: "17px",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "64px",
        }}>
          עבודות נבחרות שבנינו עבור לקוחות ועסקים מובילים.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
        }}>
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
