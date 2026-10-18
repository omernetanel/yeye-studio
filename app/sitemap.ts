import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { projects } from "@/lib/projects";

// Every service page there is, one for each service the home page lists. A
// list written by hand beside a folder of pages drifts the moment one is
// added: branding was once simply missing from it, and so never offered to a
// search engine.
const serviceSlugs = ["branding", "landing-pages", "online-stores", "dashboards"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/projects`, priority: 0.8 },
    // A brand's page, beside the sites' pages and not one of them.
    { url: `${SITE_URL}/projects/mays`, priority: 0.7 },
    { url: `${SITE_URL}/projects/sorozin-chef`, priority: 0.7 },
    { url: `${SITE_URL}/about`, priority: 0.7 },
    // Low priority, but they belong here: a search engine that has them will
    // show the right page when someone looks for the studio's privacy policy.
    { url: `${SITE_URL}/privacy`, priority: 0.3 },
    { url: `${SITE_URL}/accessibility`, priority: 0.3 },
    { url: `${SITE_URL}/terms`, priority: 0.3 },
    { url: `${SITE_URL}/site-map`, priority: 0.2 },
    ...serviceSlugs.map((slug) => ({ url: `${SITE_URL}/services/${slug}`, priority: 0.7 })),
  ];

  // Only the projects that have a page here. An external one opens the client's
  // own site and has no /projects/[slug] page, so listing it offered a search
  // engine an address that answers 404 - the same filter the page itself uses.
  const projectRoutes: MetadataRoute.Sitemap = projects
    .filter((project) => !project.external)
    .map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      priority: 0.6,
    }));

  return [...staticRoutes, ...projectRoutes];
}
