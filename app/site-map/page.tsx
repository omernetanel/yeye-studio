import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { services } from "@/lib/content";
import { projectLink, projects } from "@/lib/projects";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  label: "מפת האתר",
  description: "כל העמודים באתר YEYE Digital במקום אחד.",
  path: "/site-map",
});

/**
 * EVERY PAGE, ONE CLICK AWAY: the second way to reach any page that the
 * standard asks for (2.4.5, Multiple Ways). The menu leads to the sections of
 * the home page, and the pages under it were reached only through links inside
 * it; this page, linked from every footer, is the other way.
 *
 * Built from the same lists the site itself is built from, so a page added
 * there is listed here without anyone remembering to.
 */
const workPages = [
  // A brand's page, built by hand and not one of the projects (see MaysCase).
  { href: "/projects/mays", label: "MAY'S" },
  ...projects
    // The card's own short name and kind, as the gallery shows them: two of
    // the pieces are Lynko, and only the kind tells them apart.
    .map((project) => ({
      ...projectLink(project),
      label: `${project.cardTitle ?? project.title}${project.cardCategory ? ` - ${project.cardCategory}` : ""}`,
    }))
    .filter((link) => !link.external && link.href.startsWith("/")),
];

const groups = [
  {
    title: "ראשי",
    links: [
      { href: "/", label: "עמוד הבית" },
      { href: "/about", label: "מי אני" },
    ],
  },
  { title: "שירותים", links: services.map((service) => ({ href: service.href, label: service.title })) },
  { title: "עבודות", links: [{ href: "/projects", label: "כל העבודות" }, ...workPages] },
  {
    title: "מידע",
    links: [
      { href: "/accessibility", label: "הצהרת נגישות" },
      { href: "/privacy", label: "מדיניות פרטיות" },
      { href: "/terms", label: "תנאי שימוש" },
    ],
  },
];

export default function SiteMapPage() {
  return (
    <LegalPage title="מפת האתר" updated="18 באוקטובר 2026">
      {groups.map((group) => (
        <section key={group.title}>
          <h2>{group.title}</h2>
          <ul>
            {group.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </LegalPage>
  );
}
