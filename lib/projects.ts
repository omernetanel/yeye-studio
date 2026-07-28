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
}

export const projects: Project[] = [
  {
    slug: "lynko",
    title: "Lynko",
    cardCategory: "מערכת SaaS",
    category: "מערכת ניהול לעסקי שירות",
    description:
      "מערכת ניהול לעסקי שירות שבניתי בעברית מהיסוד, לא תרגמתי אליה תבנית באנגלית.\nיומן, לקוחות, דוחות והתראות, בממשק RTL אמיתי.",
    url: "https://lynko-liard.vercel.app/demo",
    image: "/images/lynkolayout.png",
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
        "מערכת עיצוב מרכזית - צבע, רדיוס וצל מוגדרים במקום אחד, לא מפוזרים hardcoded בתוך קומפוננטות.",
        "אנימציות עם Framer Motion לאורך הממשק - כניסות, מעברים ומשוב חזותי, בלי לפגוע בביצועים.",
        "דאטה מדומה עם seeded random - נראית אמיתית, ולא מתאפסת בצורה סותרת בכל רענון.",
        "נגישות נבדקה לעומק: ניגודיות תקנית, פלטה מאומתת לעיוורי צבעים, ו-prefers-reduced-motion מכובד בכל מקום באתר.",
      ],
      ctaTitle: "רוצה מערכת כזאת לעסק שלך?",
      ctaText:
        "לינקו היא גם תבנית בסיס. אני יכול לקחת את מה שראית כאן ולהתאים אותו למותג, לתהליך העבודה ולשירותים הספציפיים של העסק שלך. יש לך עסק שמנהל תורים - קליניקה, מספרה, ייעוץ, סטודיו - ואתה רוצה גרסה אמיתית? בוא נדבר.",
    },
  },
  {
    slug: "lynko-landing",
    title: "דף נחיתה ל-LYNKO - עיצוב, תנועה וסיפור מוצר בגלילה",
    cardTitle: "LYNKO",
    cardCategory: "דף נחיתה",
    category: "דף נחיתה שיווקי",
    description: "דף שיווקי בעברית מלאה, שבנוי לספר את הסיפור של המוצר תוך כדי גלילה, לא רק לתאר אותו.",
    url: "https://lynko-liard.vercel.app/",
    image: "/images/lynkolayoutage.png",
    tags: ["Next.js", "Framer Motion", "Tailwind CSS", "RTL קודם"],
    story: {
      storyTitle: "פרויקט עצמאי, לא עוד עמוד במערכת",
      problem:
        "דף הנחיתה של LYNKO תוכנן ונבנה כפרויקט עיצוב ופיתוח בפני עצמו, לא כעמוד נוסף בתוך המוצר. הוא כולל הירו אנימטיבי, סקשן שמספר את סיפור המוצר תוך כדי גלילה, ומערכת עיצוב עקבית שנגזרת מהמוצר עצמו, לא הומצאה בנפרד.",
      featuresTitle: "מה יש בפנים",
      features: [
        {
          icon: "sparkles",
          title: "הירו שמרגיש חי",
          description:
            "כותרת שנכנסת מילה אחרי מילה, ספוטלייט שעוקב אחרי תנועת העכבר, ומוקאפ מוצר עם הטיה תלת-ממדית עדינה בהובר. הרושם הראשון כבר קובע את הטון של כל הדף.",
        },
        {
          icon: "layers",
          title: "סיפור שנגלל",
          description:
            "סקשן מוצמד שבו ארבעה 'מסכים' של המוצר מתחלפים בזום ובקרוספייד תוך כדי גלילה, עם מסלול נפרד ומותאם למובייל במקום חוויה שבורה.",
        },
        {
          icon: "palette",
          title: "שפה עיצובית אחת",
          description:
            "כל צבע, טיפוגרפיה ורדיוס נגזרים מטוקנים מוגדרים מראש, כך שהמוצר ודף הנחיתה שלו מרגישים כמו אותה חוויה, לא שני אתרים שהודבקו יחד.",
        },
        {
          icon: "languages",
          title: "RTL מקצה לקצה",
          description:
            "לא רק יישור טקסט לימין. כולל טיפול בבעיות bidi עדינות, כמו מספרים וסימנים בתוך משפט עברי, שבהן הרבה אתרים 'מתורגמים' נשברים.",
        },
        {
          icon: "gauge",
          title: "מהיר, ונעים לכולם",
          description:
            "כל אנימציה מכבדת prefers-reduced-motion, ובלי אפקטים מוגזמים על כפתורים. תנועה שמשרתת את התוכן, לא מסיטה ממנו.",
        },
      ],
      techNotesTitle: "הצצה טכנית",
      techNotes: [
        "Next.js, Tailwind CSS ו-Framer Motion, על אותה מערכת עיצוב כמו המוצר עצמו.",
        "אנימציות מונעות-גלילה עם useScroll ו-useTransform - כולל ניפוי של תקלה אמיתית ב-Framer Motion, קלאמפינג שלא התנהג נכון בסצנה הראשונה, ותוקן ידנית אחרי חקירה.",
      ],
      ctaTitle: "רוצים דף נחיתה כזה למוצר שלכם?",
      ctaText:
        "אם יש לכם מוצר טוב שהעמוד השיווקי שלו עדיין לא עושה לו צדק, אשמח לדבר. אני בונה דפי נחיתה שמספרים סיפור, לא רק מפרטים רשימת פיצ'רים.",
    },
  },
];
