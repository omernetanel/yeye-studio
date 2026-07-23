export type ProjectFeatureIcon = "calendar" | "users" | "chart" | "bell" | "compass" | "smartphone";

export interface ProjectFeature {
  icon: ProjectFeatureIcon;
  title: string;
  description: string;
}

export interface ProjectStory {
  storyTitle: string;
  problem: string;
  featuresTitle: string;
  features: ProjectFeature[];
  techNotesTitle: string;
  techNotes: string[];
  ctaTitle: string;
  ctaText: string;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  description: string;
  url: string;
  image: string;
  tags?: string[];
  story?: ProjectStory;
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
    slug: "lynko",
    title: "Lynko",
    category: "מערכת ניהול תורים",
    description: "מערכת ניהול תורים שבניתי בעברית מהיסוד, לא תרגמתי אליה תבנית באנגלית. יומן, לקוחות, דוחות והתראות, בממשק RTL אמיתי.",
    url: "https://lynko-liard.vercel.app/",
    image: "/images/placeholder3.png",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "RTL קודם"],
    story: {
      storyTitle: "למה בניתי את זה ככה",
      problem:
        "רוב מערכות ניהול התורים בשוק נבנות באנגלית ומתורגמות לעברית בדיעבד - כיווניות שבורה, מספרים שמתהפכים, עיצוב שפשוט מרגיש הפוך. את לינקו בניתי הפוך: RTL הוא ברירת המחדל שלי, לא טלאי שמודבק בסוף.",
      featuresTitle: "מה יש בפנים",
      features: [
        {
          icon: "calendar",
          title: "יומן רב-תצוגתי",
          description: "תצוגות יום, שבוע וחודש עם זיהוי התנגשויות אוטומטי, וגרירה חופשית של תורים בין הימים.",
        },
        {
          icon: "users",
          title: "לקוחות, שירותים וצוות",
          description: "תגיות ופרטי קשר לכל לקוח, קטלוג שירותים עם קטגוריות צבע, וניהול מלא של אנשי הצוות.",
        },
        {
          icon: "chart",
          title: "דוחות ואנליטיקס",
          description:
            "הכנסות שבועיות, פילוח לפי שירות, תפוסת צוות ושיעורי ביטולים - כולל heatmap של שעות העומס, בפלטת צבעים שעברה בדיקת נגישות לעיוורי צבעים.",
        },
        {
          icon: "bell",
          title: "מרכז התראות",
          description: "תורים חדשים, תזכורות וביטולים מתעדכנים בזמן אמת, בלי לרענן ובלי לפספס כלום.",
        },
        {
          icon: "compass",
          title: "סיור מודרך",
          description: "onboarding אינטראקטיבי שמלמד משתמש חדש להכיר את המערכת תוך כדי גלישה, לא במדריך נפרד שאף אחד לא קורא.",
        },
        {
          icon: "smartphone",
          title: "רספונסיביות אמיתית",
          description:
            "בלי גלילה אופקית במובייל. כל טבלה ויומן נבנה מחדש כ-layout ייעודי לנייד - תצוגת היום הופכת לרשימת agenda, וטבלאות הופכות לכרטיסים.",
        },
      ],
      techNotesTitle: "הצצה טכנית",
      techNotes: [
        "מערכת עיצוב מבוססת טוקנים - צבע, רדיוס וצל מוגדרים במקום אחד, לא מפוזרים hardcoded בתוך קומפוננטות.",
        "אנימציות עם Framer Motion, כולל scroll-driven storytelling בסגנון שראיתי אצל אפל, בעמוד הנחיתה.",
        "דאטה מדומה עם seeded random - נראית אמיתית, ולא מתאפסת בצורה סותרת בכל רענון.",
        "נגישות נבדקה לעומק: ניגודיות תקנית, פלטה מאומתת לעיוורי צבעים, ו-prefers-reduced-motion מכובד בכל מקום באתר.",
      ],
      ctaTitle: "רוצה מערכת כזאת לעסק שלך?",
      ctaText:
        "לינקו היא גם תבנית בסיס. אני יכול לקחת את מה שראית כאן ולהתאים אותו למותג, לתהליך העבודה ולשירותים הספציפיים של העסק שלך. יש לך עסק שמנהל תורים - קליניקה, מספרה, ייעוץ, סטודיו - ואתה רוצה גרסה אמיתית? בוא נדבר.",
    },
  },
];
