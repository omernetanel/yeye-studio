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
}

// The brand's page is listed with the sites, where its landing page is; its
// address lives there. No separate link to the landing page from here: the
// brand's page shows it, live.
const sorozinSite = projects.find((project) => project.slug === "sorozin-chef");

export const designWork: DesignBrand[] = [
  {
    name: "MAY'S",
    line: "קונדיטוריה / מיתוג מלא",
    page: "/projects/mays",
    pieces: [
      // The order the brand was made in: the mark, then what it went on - the
      // box, the print, the posters. Squares and landscapes alternate, so the
      // two columns they are dealt into each get one of each. The bag is on
      // the brand's own page only (2026-10-19): four here is enough.
      {
        src: "/images/projects/mays/mays1.webp",
        alt: "הלוגו של MAY'S פתוח על מסך מחשב נייד",
        width: 1254,
        height: 1254,
      },
      {
        src: "/images/projects/mays/mays5.webp",
        alt: "קופסת המאפים של MAY'S: מכסה לבן עם הלוגו בכסף והסלוגן, וצדדים ורודים שזיגוג לבן נוזל עליהם",
        width: 1448,
        height: 1086,
      },
      {
        src: "/images/projects/mays/mays2.webp",
        alt: "כרטיסי ביקור וגיליון מדבקות של MAY'S",
        width: 1254,
        height: 1254,
      },
      {
        src: "/images/projects/mays/mays3_2.webp",
        alt: "שני פוסטרים של MAY'S על קיר, \"פשוט ממכר.\": סינבון ביד, ועוגת שמרים חצויה",
        width: 1448,
        height: 1086,
      },
    ],
  },
  {
    name: "Sorozin Chef",
    line: "שף בשרים / מיתוג מחדש",
    page: sorozinSite?.page,
    pieces: [
      {
        src: "/images/projects/sorozin/sorozin1.webp",
        alt: "כרטיסי ביקור של Sorozin Chef, שני הצדדים",
        width: 1679,
        height: 937,
      },
      {
        src: "/images/projects/sorozin/sorozin2.webp",
        alt: "הלוגו של Sorozin Chef על שני סינרים, שחור ולבן",
        width: 1227,
        height: 1282,
      },
      // The landing page, here and not only in the gallery of sites above:
      // it is part of the same rebrand, and a reader who passed it there did
      // not know that.
      {
        src: "/images/projects/sorozin/sorozinweb01.webp",
        alt: "דף הנחיתה של Sorozin Chef פתוח על מסך מחשב נייד",
        width: 1536,
        height: 1024,
      },
    ],
  },
];
