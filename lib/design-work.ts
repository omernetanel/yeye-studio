import { projects } from "@/lib/projects";

/**
 * The design work that is not a website: brands, print, packaging.
 *
 * It is listed here and laid out by DesignWorkSection, so adding a piece is a
 * line in this file and not a change to the layout. The pieces of a brand are
 * in the order they are meant to be met; the section deals them into its
 * columns from that order.
 *
 * Only the WebP files the site serves are in git. The PSDs and PNG exports
 * they came from sit beside them on disk and are ignored.
 */

export interface DesignPiece {
  src: string;
  /** What the picture shows. Not printed - it is the image's description. */
  alt: string;
  /** The file's own pixel size: the layout keeps its shape from these. */
  width: number;
  height: number;
}

export interface DesignBrand {
  name: string;
  /** The kind of business / what was made for it, on one line. */
  line: string;
  pieces: DesignPiece[];
  /** The brand's own page on this site, when it has one: its name links there. */
  page?: string;
  /** A site that goes with the brand, when there is one. */
  link?: { label: string; href: string };
}

// The landing page is already listed with the sites; its address lives there.
const sorozinSite = projects.find((project) => project.slug === "sorozin-chef");

export const designWork: DesignBrand[] = [
  {
    name: "MAY'S",
    line: "קונדיטוריה / מיתוג מלא",
    page: "/projects/mays",
    pieces: [
      {
        src: "/images/projects/mays/mays1.webp",
        alt: "הלוגו של MAY'S פתוח על מסך מחשב נייד",
        width: 1254,
        height: 1254,
      },
      // THE PACKAGING GOES HERE, second, once its 3D model exists: between the
      // logo and the print, not after everything else.
      {
        src: "/images/projects/mays/mays2.webp",
        alt: "כרטיסי ביקור וגיליון מדבקות של MAY'S",
        width: 1254,
        height: 1254,
      },
      {
        src: "/images/projects/mays/mays3.webp",
        alt: "פוסטר ותפריט של MAY'S",
        width: 1448,
        height: 1086,
      },
    ],
  },
  {
    name: "Sorozin Chef",
    line: "שף פרטי / לוגו, כרטיסי ביקור ודף נחיתה",
    pieces: [
      {
        src: "/images/projects/sorozin/sorozin1.webp",
        alt: "כרטיסי ביקור של Sorozin Chef, שני הצדדים",
        width: 1679,
        height: 937,
      },
    ],
    link: sorozinSite ? { label: "לדף הנחיתה", href: sorozinSite.url } : undefined,
  },
];
