export type ProjectFeatureIcon =
  | "calendar"
  | "users"
  | "chart"
  | "bell"
  | "compass"
  | "smartphone"
  | "sparkles"
  | "layers"
  | "palette"
  | "languages"
  | "gauge";

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
  /** Short labels for project cards (listing/teaser grids) - fall back to `title`/`category` when omitted. */
  cardTitle?: string;
  cardCategory?: string;
  category: string;
  description: string;
  url: string;
  image: string;
  tags?: string[];
  story?: ProjectStory;
  /** Card links straight out to `url` instead of an internal /projects/[slug] page — no detail page is generated for it. */
  external?: boolean;
}

export const projects: Project[] = [
  {
    slug: "lynko",
    title: "Lynko",
    cardCategory: "מערכת SaaS",
    category: "מערכת ניהול לעסקי שירות",
    description:
      "מערכת ניהול לעסקי שירות שבניתי בעברית מהיסוד, ולא תבנית באנגלית שתורגמה.\nיומן, לקוחות, דוחות והתראות, בממשק RTL אמיתי.",
    url: "https://lynko-liard.vercel.app/demo",
    image: "/images/projects/lynkosass.webp",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "RTL קודם"],
    story: {
      storyTitle: "למה בניתי את זה ככה",
      problem:
        "רוב מערכות ניהול התורים בשוק נבנות באנגלית ומתורגמות לעברית בדיעבד. התוצאה היא כיווניות שבורה, מספרים שמתהפכים ועיצוב שמרגיש הפוך. את לינקו בניתי מהכיוון השני: RTL היה נקודת המוצא, ולא טלאי שהודבק בסוף.",
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
            "הכנסות שבועיות, פילוח לפי שירות, תפוסת צוות ושיעורי ביטולים, כולל מפת חום של שעות העומס בצבעים שנבדקו גם לעיוורי צבעים.",
        },
        {
          icon: "bell",
          title: "מרכז התראות",
          description: "תורים חדשים, תזכורות וביטולים מתעדכנים בזמן אמת, בלי לרענן ובלי לפספס כלום.",
        },
        {
          icon: "compass",
          title: "סיור מודרך",
          description: "סיור היכרות אינטראקטיבי שמלמד משתמש חדש את המערכת תוך כדי שימוש, במקום מדריך נפרד שאף אחד לא קורא.",
        },
        {
          icon: "smartphone",
          title: "רספונסיביות אמיתית",
          description:
            "בלי גלילה אופקית בטלפון. כל טבלה ויומן קיבלו פריסה משלהם לנייד: תצוגת היום הופכת לרשימה, והטבלאות הופכות לכרטיסים.",
        },
      ],
      techNotesTitle: "הצצה טכנית",
      techNotes: [
        "מערכת עיצוב מרכזית: צבע, רדיוס וצל מוגדרים במקום אחד ולא מפוזרים בתוך הקומפוננטות.",
        "אנימציות עם Framer Motion לאורך כל הממשק, בכניסות, במעברים ובמשוב, בלי לפגוע בביצועים.",
        "נתוני דמו שנוצרים מ-seed קבוע, כך שהם נראים אמיתיים ולא משתנים בכל רענון.",
        "נגישות נבדקה לעומק: ניגודיות תקנית, פלטה מאומתת לעיוורי צבעים, ו-prefers-reduced-motion מכובד בכל מקום באתר.",
      ],
      ctaTitle: "רוצים מערכת כזאת לעסק שלכם?",
      ctaText:
        "לינקו היא גם בסיס לעבודה. אפשר לקחת את מה שראיתם כאן ולהתאים אותו למותג, לתהליכים ולשירותים של העסק שלכם. מנהלים תורים בקליניקה, במספרה, בייעוץ או בסטודיו ורוצים גרסה משלכם? בואו נדבר.",
    },
  },
  {
    slug: "lynko-landing",
    title: "דף נחיתה ל-LYNKO: עיצוב, תנועה וסיפור מוצר בגלילה",
    cardTitle: "LYNKO",
    cardCategory: "דף נחיתה",
    category: "דף נחיתה שיווקי",
    description: "דף שיווקי בעברית מלאה שמספר את הסיפור של המוצר תוך כדי גלילה.",
    url: "https://lynko-liard.vercel.app/",
    image: "/images/projects/lynkoweb.webp",
    tags: ["Next.js", "Framer Motion", "Tailwind CSS", "RTL קודם"],
    story: {
      storyTitle: "פרויקט בפני עצמו",
      problem:
        "תכננתי ובניתי את דף הנחיתה של LYNKO כפרויקט עיצוב ופיתוח נפרד, ולא כעוד עמוד בתוך המוצר. יש בו הירו מונפש, סקשן שמספר את סיפור המוצר בזמן הגלילה, ומערכת עיצוב שנגזרת מהמוצר עצמו.",
      featuresTitle: "מה יש בפנים",
      features: [
        {
          icon: "sparkles",
          title: "הירו שמרגיש חי",
          description:
            "כותרת שנכנסת מילה אחרי מילה, אור שעוקב אחרי העכבר ומוקאפ עם הטיה תלת-ממדית עדינה כשעוברים עליו. הרושם הראשון קובע את הטון לכל הדף.",
        },
        {
          icon: "layers",
          title: "סיפור שנגלל",
          description:
            "סקשן נעוץ שבו ארבעה מסכים של המוצר מתחלפים בזום ובמעבר הדרגתי תוך כדי גלילה, עם גרסה נפרדת שנבנתה לטלפון.",
        },
        {
          icon: "palette",
          title: "שפה עיצובית אחת",
          description:
            "כל צבע, גופן ורדיוס מגיעים מאותם טוקנים, כך שהמוצר ודף הנחיתה שלו מרגישים כמו מקום אחד.",
        },
        {
          icon: "languages",
          title: "RTL מקצה לקצה",
          description:
            "יותר מיישור טקסט לימין. גם הבעיות הקטנות של טקסט דו-כיווני, כמו מספרים וסימנים בתוך משפט בעברית, שבהן הרבה אתרים מתורגמים נשברים.",
        },
        {
          icon: "gauge",
          title: "מהיר ונעים לכולם",
          description:
            "כל אנימציה מכבדת את prefers-reduced-motion, ואין אפקטים מוגזמים על כפתורים. התנועה נמצאת שם כדי לשרת את התוכן.",
        },
      ],
      techNotesTitle: "הצצה טכנית",
      techNotes: [
        "Next.js, Tailwind CSS ו-Framer Motion, על אותה מערכת עיצוב כמו המוצר עצמו.",
        "אנימציות שמונעות מהגלילה עם useScroll ו-useTransform, כולל איתור ותיקון של באג אמיתי ב-Framer Motion שגרם לסצנה הראשונה להתנהג לא נכון.",
      ],
      ctaTitle: "רוצים דף נחיתה כזה למוצר שלכם?",
      ctaText:
        "יש לכם מוצר טוב ודף שיווקי שעוד לא עושה לו צדק? אשמח לדבר. אני בונה דפי נחיתה שמספרים סיפור, במקום לפרט רשימת פיצ'רים.",
    },
  },
  {
    slug: "sorozin-chef",
    title: "Sorozin Chef",
    cardCategory: "דף נחיתה",
    category: "דף נחיתה",
    description: "דף נחיתה שבניתי עבור Sorozin Chef.",
    url: "https://sorozinchef.pages.dev/",
    image: "/images/projects/sorozinchefweb.webp",
    external: true,
  },
  {
    slug: "lby-studio",
    title: "LBY STUDIO",
    cardCategory: "אפליקציית תורים",
    category: "אפליקציית תורים למספרה",
    description: "אפליקציית תורים למספרה שבניתי ל-LBY STUDIO.",
    // No detail page yet — external:true routes the card straight to
    // /projects/lby-studio, which the [slug] page's own notFound() call
    // (for any external project) turns into a genuine 404. Swap this to
    // external:false and add a `story` once the real project page exists.
    url: "/projects/lby-studio",
    image: "/images/lbysreenweb.webp",
    external: true,
  },
];
