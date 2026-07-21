"use client";

import { Code2, MessageSquare, Monitor, Paintbrush, Rocket, Shield, Star, TrendingUp } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import ServiceAmbientBackground from "@/components/services/ServiceAmbientBackground";
import ServiceHero from "@/components/services/ServiceHero";
import WhatIsIt from "@/components/services/WhatIsIt";
import StatsSection from "@/components/services/StatsSection";
import TypesGrid from "@/components/services/TypesGrid";
import ProcessTimeline from "@/components/services/ProcessTimeline";
import PrinciplesGrid from "@/components/services/PrinciplesGrid";
import WhatYouGet from "@/components/services/WhatYouGet";
import ExamplesPlaceholder from "@/components/services/ExamplesPlaceholder";
import ServiceFinalCTA from "@/components/services/ServiceFinalCTA";

const principles = [
  { icon: Monitor, title: "עיצוב שמייצג אותך", description: "לא תבנית גנרית. כל אתר מעוצב מאפס כדי לשקף את הזהות האמיתית של העסק." },
  { icon: Shield, title: "אמינות ואבטחה", description: "SSL, גיבויים אוטומטיים, וביצועים מהירים, כי אתר איטי הוא אתר לא מקצועי." },
  { icon: TrendingUp, title: "בנוי לצמוח", description: "ארכיטקטורה שמאפשרת להוסיף שירותים, עמודים ותכנים ככל שהעסק גדל." },
  { icon: Star, title: "חוויית משתמש", description: "מבקר שנהנה מהאתר נשאר זמן רב יותר, סומך יותר, ומתקשר." },
];

const siteTypes = [
  { title: "עסקים מקומיים", description: "רופאים, עורכי דין, יועצים: אתר שבונה אמון ומביא פניות מהסביבה.", use: "מתאים כש: לקוחות מחפשים אותך בגוגל לפי אזור" },
  { title: "חברות ועסקים", description: "נוכחות דיגיטלית ברמה גבוהה שמציגה את הצוות, השירותים וההישגים.", use: "מתאים כש: אתה צריך להיראות גדול ואמין ללקוחות עסקיים" },
  { title: "פרילנסרים ומותגים אישיים", description: "פורטפוליו מרשים שמוכר את עצמו, גם כשאתה לא זמין לענות.", use: "מתאים כש: הכישרון שלך הוא המוצר ואתה רוצה שיראו אותו" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "היכרות ואפיון", description: "לומדים את העסק, הקהל, המתחרים והיעדים. מגדירים את המסר הנכון לפני שמתחילים לעצב." },
  { number: "02", icon: Paintbrush, title: "עיצוב ויזואלי", description: "בונים זהות ויזואלית שמשקפת את העסק: צבעים, טיפוגרפיה, פריסה. כל החלטה עם סיבה." },
  { number: "03", icon: Code2, title: "פיתוח ואופטימיזציה", description: "קוד נקי, טעינה מהירה, SEO בסיסי, ומובייל מושלם. בנוי לטווח הארוך." },
  { number: "04", icon: Rocket, title: "השקה וליווי", description: "עולים לאוויר עם בדיקות מלאות. מלמדים אותך לנהל ועדכן תכנים בצורה עצמאית." },
];

const stats = [
  { stat: "75%", statLabel: "מהמשתמשים שופטים אמינות לפי העיצוב", text: "לקוח שמחפש שירות בגוגל מסתכל על האתר שלך לפני שהוא מתקשר. אתר ישן, איטי, או לא מקצועי אומר לו הכל. לא צריך להגיד 'אנחנו מקצועיים', צריך להראות את זה." },
  { stat: "57%", statLabel: "לא ימליצו על עסק עם אתר גרוע במובייל", text: "לקוח שנכנס מהנייד ורואה אתר שלא מסתגל, פשוט לא חוזר. אתר תדמית טוב הוא קודם כל אתר שנראה מושלם על כל מסך." },
  { stat: "88%", statLabel: "לא יחזרו לאתר אחרי חוויה גרועה", text: "יש לך הזדמנות אחת לעשות רושם. אתר שנטען לאט, קשה לניווט, או לא ברור מאבד לקוחות לצמיתות. אתר תדמית טוב הוא השקעה שמחזירה את עצמה בכל לקוח שפונה." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "הדרכת ניהול תוכן", description: "מלמדים אותך לעדכן טקסטים, תמונות ועמודים בעצמך, בלי צורך לפנות אלינו על כל שינוי קטן." },
    { number: "02", title: "זמינות אמיתית", description: "עולה שאלה או צריך לעדכן משהו? תמיד תדע בדיוק עם מי אתה מדבר ומי אחראי על הפרויקט שלך." },
  ],
  [
    { number: "03", title: "ליווי טכני מקצה לקצה", description: "דומיין, אחסון ו-SSL, את הכל אנחנו מסדרים. אין צורך להבין טכנולוגיה כדי להשיק אתר מקצועי." },
    { number: "04", title: "תמיכה לאחר ההשקה", description: "חודש תמיכה מלאה אחרי ההשקה, ללא עלות נוספת. אנחנו כאן לכל תיקון, עדכון או שאלה." },
  ],
];

export default function BusinessSitesContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <ScrollToTop />
      <ServiceAmbientBackground />
      <Navbar />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="אתר תדמית שגורם"
          titleLine2="ללקוחות לסמוך עליך"
          description="הרושם הראשון נוצר אונליין. אתר תדמית מקצועי הוא ההבדל בין לקוח שפונה לבין לקוח שממשיך לגלול."
          ctaLabel="בוא נבנה את האתר שלך"
        />
        <WhatIsIt
          title="מה זה אתר תדמית?"
          text="אתר תדמית הוא הפנים הדיגיטליות של העסק שלך. הוא לא מוכר ישירות, אלא בונה אמון, מציג מומחיות, ומוביל לקוחות פוטנציאליים לפנות אליך. זה ההבדל בין עסק שנראה אמין לבין עסק שנראה מקצועי באמת."
        />
        <StatsSection title="למה אתר תדמית הוא חובה" stats={stats} />
        <TypesGrid title="איזה סוג אתר מתאים לך?" items={siteTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלנו" items={principles} />
        <WhatYouGet title="וזה לא הכל" subtitle="כל פרויקט מגיע עם שכבת שירות שמעטים מציעים" rows={whatYouGetRows} />
        <ExamplesPlaceholder title="דוגמאות מהעבודה שלנו" labelPrefix="אתר תדמית" />
        <ServiceFinalCTA title="רוצה אתר שגורם ללקוחות לסמוך עליך?" />
      </div>

      <Footer />
    </main>
  );
}
