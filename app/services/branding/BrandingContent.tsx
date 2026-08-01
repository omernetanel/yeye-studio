"use client";

import { Fingerprint, Layers, MessageSquare, Paintbrush, Palette, Rocket, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
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
  { icon: Palette, title: "עיצוב עקבי", description: "שפה עיצובית אחידה בכל נקודת מגע: אתר, רשתות חברתיות, חומרים מודפסים ועוד." },
  { icon: Fingerprint, title: "זהות ייחודית", description: "מיתוג שמבדל אותך מהמתחרים ומשקף בדיוק מי אתה ומה אתה מציע." },
  { icon: Layers, title: "מערכת שלמה", description: "לא רק לוגו: מדריך מותג מלא עם צבעים, פונטים וכללי שימוש שכל ספק יכול לעבוד לפיו." },
  { icon: Sparkles, title: "רושם ראשוני חזק", description: "מותג מוקפד בונה אמון תוך שניות ומגדיל את הסיכוי שלקוח פוטנציאלי יבחר בך." },
];

const brandTypes = [
  { title: "עסקים חדשים", description: "בניית זהות מותג מאפס: לוגו, פלטת צבעים, טיפוגרפיה ומדריך מותג מלא.", use: "מתאים כש: אתה משיק עסק חדש וצריך זהות מקצועית מהיום הראשון" },
  { title: "מיתוג מחדש", description: "רענון זהות למותג קיים שהזדקן או לא משקף יותר את העסק שהפך להיות.", use: "מתאים כש: העיצוב הנוכחי שלך לא תואם את הרמה שהעסק הגיע אליה" },
  { title: "הרחבת מותג", description: "התאמת הזהות הקיימת שלך למוצרים, שירותים או ערוצים חדשים.", use: "מתאים כש: אתה מרחיב את העסק וצריך עקביות בין כל הערוצים" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "מחקר ואסטרטגיה", description: "אני לומד את העסק, הקהל והמתחרים כדי להבין איזו זהות תדבר הכי חזק ללקוחות שלך." },
  { number: "02", icon: Paintbrush, title: "עיצוב הזהות", description: "אני מפתח קונספטים ללוגו, פלטת צבעים וטיפוגרפיה עד שמוצאים את הכיוון הנכון." },
  { number: "03", icon: Layers, title: "בניית מערכת מלאה", description: "אני מרחיב את הזהות לכל נקודות המגע: כרטיסי ביקור, רשתות חברתיות, מסמכים ועוד." },
  { number: "04", icon: Rocket, title: "מסירה והטמעה", description: "אתה מקבל מדריך מותג מלא וכל הקבצים הדרושים כדי להשתמש בזהות בעצמך בביטחון." },
];

const stats = [
  { stat: "80%", statLabel: "מהרושם הראשוני מבוסס על עיצוב חזותי", text: "לקוח פוטנציאלי מגבש דעה על העסק שלך תוך שניות, עוד לפני שקרא מילה. מיתוג מוקפד הוא מה שגורם לרושם הזה לעבוד לטובתך." },
  { stat: "×3", statLabel: "יותר זיכרון מותג עם זהות עקבית", text: "מותג שנראה אותו הדבר בכל מקום, באתר, ברשתות, בחומרים מודפסים, נחקק בזיכרון הרבה יותר מעסק עם עיצוב מבולגן ולא עקבי." },
  { stat: "100%", statLabel: "בעלות מלאה על הזהות שלך", text: "אתה מקבל את כל הקבצים והמדריך המלא, לא תלוי בי כדי להשתמש בזהות שלך בכל פלטפורמה או ספק בעתיד." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "מדריך מותג מלא", description: "מסמך אחד עם כל הכללים: לוגו, צבעים, טיפוגרפיה ודוגמאות שימוש, כדי שכל ספק יוכל לעבוד לפי הזהות שלך." },
    { number: "02", title: "קבצי מקור מלאים", description: "קבצים עריכים בכל הפורמטים הנדרשים, לא רק PNG. הזהות שלך, בבעלות מלאה שלך." },
  ],
  [
    { number: "03", title: "ליווי צמוד לתהליך", description: "אתה מעורב בכל שלב ורואה את הזהות מתפתחת, לא מקבל הפתעה בסוף התהליך." },
    { number: "04", title: "תמיכה לאחר המסירה", description: "שאלות על שימוש בזהות או התאמות קטנות? אני כאן גם אחרי שהפרויקט נגמר." },
  ],
];

export default function BrandingContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      <ServiceAmbientBackground />
      <Navbar />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="זהות מותג שגורמת"
          titleLine2="לעסק שלך להיזכר"
          description="זהות חזותית מלאה שמבדלת אותך מהמתחרים ובונה מותג שנשאר בזיכרון, מהלוגו ועד לכל נקודת מגע עם הלקוח."
          ctaLabel="בוא נבנה את המותג שלך"
        />
        <WhatIsIt
          title="מה זה מיתוג עסקי?"
          text="מיתוג עסקי הוא הזהות החזותית והתחושה שהעסק שלך משדר בכל נקודת מגע: לוגו, צבעים, טיפוגרפיה, ושפה עיצובית אחידה. זה מה שהופך עסק אנונימי למותג שלקוחות זוכרים, סומכים עליו וממליצים עליו."
        />
        <StatsSection title="למה מיתוג עסקי הוא חובה" stats={stats} />
        <TypesGrid title="איזה סוג מיתוג מתאים לך?" items={brandTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלי" items={principles} />
        <WhatYouGet title="וזה לא הכל" subtitle="כל פרויקט מגיע עם שכבת שירות שמעטים מציעים" rows={whatYouGetRows} />
        <ServiceFinalCTA title="רוצה מותג שאנשים זוכרים?" />
      </div>

      <Footer light />
    </main>
  );
}
