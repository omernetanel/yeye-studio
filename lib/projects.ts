export interface Project {
  slug: string;
  title: string;
  category: string;
  description: string;
  url: string;
  image: string;
}

export const projects: Project[] = [
  {
    slug: "fashion-store",
    title: "Fashion Store",
    category: "חנות אונליין",
    description: "חנות אופנה פרמיום עם חווית קנייה מתקדמת, עיצוב מינימליסטי ומערכת ניהול מוצרים מלאה.",
    url: "",
    image: "/images/placeholder1.png",
  },
  {
    slug: "buildpro",
    title: "BuildPro",
    category: "אתר תדמית",
    description: "אתר תדמית לחברת בנייה עם עיצוב חזק ומקצועי, גלריית פרויקטים ומערכת יצירת קשר.",
    url: "",
    image: "/images/placeholder2.png",
  },
  {
    slug: "bookeasy",
    title: "BookEasy",
    category: "מערכת ניהול תורים",
    description: "מערכת ניהול תורים חכמה לעסקים קטנים ובינוניים, עם לוח שנה, ניהול לקוחות ודוחות.",
    url: "",
    image: "/images/placeholder3.png",
  },
];
