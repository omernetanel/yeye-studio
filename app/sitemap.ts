import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";

// TODO: replace with the real production domain before launch.
const BASE_URL = "https://yeyelabs.com";

const serviceSlugs = ["online-stores", "landing-pages", "business-sites", "dashboards"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1 },
    { url: `${BASE_URL}/projects`, priority: 0.8 },
    { url: `${BASE_URL}/contact`, priority: 0.8 },
    ...serviceSlugs.map((slug) => ({ url: `${BASE_URL}/services/${slug}`, priority: 0.7 })),
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${BASE_URL}/projects/${project.slug}`,
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes];
}
