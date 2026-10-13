"use client";

import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import ServicePage, { type ServicePageContent } from "@/components/services/ServicePage";

// Everything this page says, in one place. The layout is ServicePage's.
const CONTENT: ServicePageContent = {
  href: "/services/branding",
  title: ["זהות מותג שגורמת", "לעסק שלכם להיזכר."],
  lead: "זהות חזותית מלאה שמבדלת אתכם מהמתחרים ונשארת בזיכרון, מהלוגו ועד כל מקום שבו לקוח פוגש אתכם.",
  cta: "בואו נבנה את המותג שלכם",

  reasonsTitle: "למה כדאי להשקיע במיתוג",
  reasons: [
    {
      stat: "50ms",
      label: "מספיקות כדי לגבש רושם מהעיצוב",
      text: "המראה נשפט לפני שנקראת מילה אחת. מיתוג מוקפד גורם לרושם המיידי הזה לעבוד לטובתכם.",
      source: { name: "Lindgaard et al., 2006", href: "https://doi.org/10.1080/01449290500330448" },
    },
    {
      stat: "אותו מותג",
      label: "באתר, ברשתות, בדפוס ובכל מקום אחר",
      text: "עסק שכל ערוץ שלו נראה אחר נראה כמו כמה עסקים קטנים. זהות אחת שחוזרת בכל מקום היא מה שגורם לזכור אתכם.",
    },
    {
      stat: "אצלכם",
      label: "קבצי המקור והחומרים שנמסרים בסיום",
      text: "בסיום נמסרים לכם קבצי המקור והחומרים שנכללים בפרויקט, כדי שתוכלו להמשיך לעבוד עם כל ספק ובכל פלטפורמה.",
    },
  ],

  kindsTitle: "איזה סוג מיתוג מתאים לכם?",
  kinds: [
    {
      title: "עסקים חדשים",
      text: "זהות מותג מאפס: לוגו, צבעים, טיפוגרפיה ומדריך מותג מלא.",
      fits: "מתאים אם אתם משיקים עסק וצריכים זהות מקצועית מהיום הראשון.",
    },
    {
      title: "מיתוג מחדש",
      text: "רענון למותג שהתיישן או שכבר לא משקף את העסק שהוא הפך להיות.",
      fits: "מתאים אם העיצוב הנוכחי כבר לא ברמה של העסק.",
    },
    {
      title: "הרחבת מותג",
      text: "התאמה של הזהות הקיימת למוצרים, לשירותים או לערוצים חדשים.",
      fits: "מתאים אם העסק מתרחב וצריך שכל הערוצים ייראו אותו דבר.",
    },
  ],

  includesTitle: "מה מקבלים",
  includes: [
    {
      title: "מדריך מותג מלא",
      text: "מסמך אחד עם כל הכללים: לוגו, צבעים, טיפוגרפיה ודוגמאות שימוש, כדי שכל ספק יוכל לעבוד לפי הזהות שלכם.",
    },
    {
      title: "קבצי מקור",
      text: "קבצי מקור פתוחים לעריכה בפורמטים שנכללים במסירה, ולא רק PNG.",
    },
    {
      title: "ליווי צמוד לתהליך",
      text: "אתם מעורבים בכל שלב ורואים את הזהות מתפתחת, בלי הפתעות בסוף.",
    },
    {
      title: "חודש תמיכה לאחר המסירה",
      text: "מענה לתיקונים הנדרשים בחומרים שנמסרו במסגרת הפרויקט, ללא עלות נוספת.",
    },
  ],

  // The two brands the site has a page for. Each picture is one that page
  // shows too.
  work: [
    {
      name: "MAY'S",
      href: "/projects/mays",
      piece: {
        src: "/images/projects/mays/mays2.webp",
        alt: "כרטיסי ביקור וגיליון מדבקות של MAY'S",
        width: 1254,
        height: 1254,
      },
    },
    {
      name: "Sorozin Chef",
      href: "/projects/sorozin-chef",
      piece: {
        src: "/images/projects/sorozin/sorozin4.webp",
        alt: "קרש חיתוך, סט סכינים ומעמד עם הלוגו והשם של Sorozin Chef",
        width: 1536,
        height: 1024,
      },
    },
  ],

  stepsTitle: "איך זה עובד?",
  steps: [
    {
      title: "מחקר ואסטרטגיה",
      text: "אני לומד את העסק, את הקהל ואת המתחרים כדי להבין איזו זהות תדבר הכי חזק ללקוחות שלכם.",
    },
    {
      title: "עיצוב הזהות",
      text: "אני מפתח כיוונים ללוגו, לצבעים ולטיפוגרפיה עד שמוצאים את הכיוון הנכון.",
    },
    {
      title: "בניית המערכת",
      text: "אני מרחיב את הזהות לכל מקום שבו פוגשים אתכם: כרטיסי ביקור, רשתות חברתיות, מסמכים ועוד.",
    },
    {
      title: "מסירה",
      text: "אתם מקבלים מדריך מותג ואת קבצי המקור שנכללים במסירה, כדי להשתמש בזהות לבד ובביטחון.",
    },
  ],

  closing: "רוצים מותג שאנשים זוכרים?",
};

export default function BrandingContent() {
  return (
    <main id="main" className="relative min-h-screen bg-white">
      <Navbar />
      {/* No bar: the page is black from the very top. */}
      <SubPageNav bare />
      <ServicePage content={CONTENT} />
      {/* The dark footer: the page closes on black. */}
      <div className="bg-black">
        <Footer />
      </div>
    </main>
  );
}
