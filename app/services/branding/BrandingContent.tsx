"use client";

import { Fingerprint, Layers, MessageSquare, Paintbrush, Palette, Rocket, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import ServiceAmbientBackground from "@/components/services/ServiceAmbientBackground";
import ServiceHero from "@/components/services/ServiceHero";
import WhatIsIt from "@/components/services/WhatIsIt";
import StatsSection from "@/components/services/StatsSection";
import TypesGrid from "@/components/services/TypesGrid";
import ProcessTimeline from "@/components/services/ProcessTimeline";
import PrinciplesGrid from "@/components/services/PrinciplesGrid";
import WhatYouGet from "@/components/services/WhatYouGet";
import ServiceFinalCTA from "@/components/services/ServiceFinalCTA";

const principles = [
  { icon: Palette, title: "עיצוב עקבי", description: "שפה עיצובית אחת בכל מקום: באתר, ברשתות החברתיות, בדפוס ובכל השאר." },
  { icon: Fingerprint, title: "זהות ייחודית", description: "מיתוג שמבדל אתכם מהמתחרים ומשקף בדיוק מי אתם ומה אתם מציעים." },
  { icon: Layers, title: "מערכת שלמה", description: "לוגו הוא רק ההתחלה. מקבלים מדריך מותג עם צבעים, גופנים וכללי שימוש שכל ספק יכול לעבוד לפיו." },
  { icon: Sparkles, title: "רושם ראשוני חזק", description: "מותג מוקפד בונה אמון תוך שניות ומגדיל את הסיכוי שיבחרו בכם." },
];

const brandTypes = [
  { title: "עסקים חדשים", description: "זהות מותג מאפס: לוגו, צבעים, טיפוגרפיה ומדריך מותג מלא.", use: "מתאים אם אתם משיקים עסק וצריכים זהות מקצועית מהיום הראשון" },
  { title: "מיתוג מחדש", description: "רענון למותג שהתיישן או שכבר לא משקף את העסק שהוא הפך להיות.", use: "מתאים אם העיצוב הנוכחי כבר לא ברמה של העסק" },
  { title: "הרחבת מותג", description: "התאמה של הזהות הקיימת למוצרים, לשירותים או לערוצים חדשים.", use: "מתאים אם העסק מתרחב וצריך שכל הערוצים ייראו אותו דבר" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "מחקר ואסטרטגיה", description: "אני לומד את העסק, את הקהל ואת המתחרים כדי להבין איזו זהות תדבר הכי חזק ללקוחות שלכם." },
  { number: "02", icon: Paintbrush, title: "עיצוב הזהות", description: "אני מפתח כיוונים ללוגו, לצבעים ולטיפוגרפיה עד שמוצאים את הכיוון הנכון." },
  { number: "03", icon: Layers, title: "בניית המערכת", description: "אני מרחיב את הזהות לכל מקום שבו פוגשים אתכם: כרטיסי ביקור, רשתות חברתיות, מסמכים ועוד." },
  { number: "04", icon: Rocket, title: "מסירה", description: "אתם מקבלים מדריך מותג ואת קבצי המקור שנכללים במסירה, כדי להשתמש בזהות לבד ובביטחון." },
];

const stats = [
  { stat: "50ms", statLabel: "מספיקות כדי לגבש רושם מהעיצוב", source: { name: "Lindgaard et al., 2006", href: "https://doi.org/10.1080/01449290500330448" }, text: "המראה נשפט לפני שנקראת מילה אחת. מיתוג מוקפד גורם לרושם המיידי הזה לעבוד לטובתכם." },
  { stat: "אותו מותג", statLabel: "באתר, ברשתות, בדפוס ובכל מקום אחר", text: "עסק שכל ערוץ שלו נראה אחר נראה כמו כמה עסקים קטנים. זהות אחת שחוזרת בכל מקום היא מה שגורם לזכור אתכם." },
  { stat: "אצלכם", statLabel: "קבצי המקור והחומרים שנמסרים בסיום", text: "בסיום נמסרים לכם קבצי המקור והחומרים שנכללים בפרויקט, כדי שתוכלו להמשיך לעבוד עם כל ספק ובכל פלטפורמה." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "מדריך מותג מלא", description: "מסמך אחד עם כל הכללים: לוגו, צבעים, טיפוגרפיה ודוגמאות שימוש, כדי שכל ספק יוכל לעבוד לפי הזהות שלכם." },
    { number: "02", title: "קבצי מקור", description: "קבצי מקור פתוחים לעריכה בפורמטים שנכללים במסירה, ולא רק PNG." },
  ],
  [
    { number: "03", title: "ליווי צמוד לתהליך", description: "אתם מעורבים בכל שלב ורואים את הזהות מתפתחת, בלי הפתעות בסוף." },
    { number: "04", title: "חודש תמיכה לאחר המסירה", description: "מענה לתיקונים הנדרשים בחומרים שנמסרו במסגרת הפרויקט, ללא עלות נוספת." },
  ],
];

export default function BrandingContent() {
  return (
    <main id="main" className="relative min-h-screen overflow-hidden bg-white">
      <ServiceAmbientBackground />
      <Navbar />
      <SubPageNav />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="זהות מותג שגורמת"
          titleLine2="לעסק שלכם להיזכר"
          description="זהות חזותית מלאה שמבדלת אתכם מהמתחרים ונשארת בזיכרון, מהלוגו ועד כל מקום שבו לקוח פוגש אתכם."
          ctaLabel="בואו נבנה את המותג שלכם"
        />
        <WhatIsIt
          title="מה זה מיתוג עסקי?"
          text="מיתוג עסקי הוא המראה והתחושה שהעסק משדר בכל מקום: לוגו, צבעים, טיפוגרפיה ושפה עיצובית אחת. הוא מה שהופך עסק אנונימי למותג שלקוחות זוכרים, סומכים עליו וממליצים עליו."
        />
        <StatsSection title="למה כדאי להשקיע במיתוג" stats={stats} />
        <TypesGrid title="איזה סוג מיתוג מתאים לך?" items={brandTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלי" items={principles} />
        <WhatYouGet title="וזה לא הכול" subtitle="מה מקבלים מעבר לזהות עצמה" rows={whatYouGetRows} />
        <ServiceFinalCTA title="רוצים מותג שאנשים זוכרים?" />
      </div>

      <Footer light />
    </main>
  );
}
