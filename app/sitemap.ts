import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { projects } from "@/lib/projects";

// Every service page there is. It was four of the five — branding was simply
// missing, and so never offered to a search engine — and a list written by
// hand beside a folder of pages drifts the moment one is added.
const serviceSlugs = ["online-stores", "landing-pages", "business-sites", "dashboards", "branding"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/projects`, priority: 0.8 },
    ...serviceSlugs.map((slug) => ({ url: `${SITE_URL}/services/${slug}`, priority: 0.7 })),
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes];
}
