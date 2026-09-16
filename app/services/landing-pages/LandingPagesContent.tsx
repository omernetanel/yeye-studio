"use client";

import { Code2, MessageSquare, Paintbrush, Rocket, Smartphone, Target, Users, Zap } from "lucide-react";
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
  { icon: Target, title: "מטרה אחת ברורה", description: "כל דף בנוי סביב פעולה אחת, בלי הסחות ובלי תפריטים שמושכים לצדדים." },
  { icon: Zap, title: "טעינה מהירה", description: "כל שנייה של המתנה עולה בפניות. הדפים שאני בונה נטענים מהר." },
  { icon: Smartphone, title: "קודם כול לטלפון", description: "רוב הגולשים מגיעים מהטלפון, אז משם אני מתחיל לתכנן." },
  { icon: Users, title: "הוכחה חברתית", description: "המלצות במקום הנכון הן לפעמים מה שמכריע את ההחלטה." },
];

const pageTypes = [
  { title: "איסוף לידים", description: "פרטי קשר תמורת משהו שווה: שיחת ייעוץ, קטלוג או הצעת מחיר.", use: "מתאים אם אתם רוצים לבנות רשימת לקוחות פוטנציאליים" },
  { title: "מכירה ישירה", description: "דף ממוקד שמוביל ישר לרכישה של מוצר, שירות או חבילה.", use: "מתאים אם יש לכם הצעה ברורה שמוכנה לסגירה" },
  { title: "חימום לפני פנייה", description: "מסביר לעומק ובונה אמון לפני שמבקש מהגולש לעשות משהו.", use: "מתאים אם הגולשים שלכם עוד לא מכירים אתכם וצריכים הסבר" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "הבנת המטרה והקהל", description: "לפני שנכתבת מילה, אנחנו יושבים ואני לומד את העסק. מי הלקוח שאתם רוצים? מה מטריד אותו? מה עוצר אותו מלפנות? מהתשובות האלה נבנה הדף." },
  { number: "02", icon: Paintbrush, title: "כתיבת המסר", description: "כותרת שפוגעת בבעיה, טקסט שבונה אמון וכפתור שברור מה הוא עושה. בלי מילות מילוי ובלי ז'רגון." },
  { number: "03", icon: Code2, title: "עיצוב ופיתוח", description: "אני בונה את הדף מאפס ולא מתבנית. עיצוב שמדבר לקהל שלכם, קוד מהיר ב-Next.js וחוויה טובה בטלפון." },
  { number: "04", icon: Rocket, title: "בדיקות והשקה", description: "לפני שהדף עולה אני בודק אותו בכל מכשיר ודפדפן, מוודא שהוא נטען מהר ומלטש את הפרטים האחרונים. ביום ההשקה אני שם." },
];

const stats = [
  { stat: "-7%", statLabel: "המרות על כל שנייה של טעינה", text: "מי שלוחץ על מודעה מחליט תוך שניות אם להישאר. אתר רגיל מציג לו תפריט, עמוד בית ועשר דרכים ללכת לאיבוד. דף נחיתה עושה דבר אחד: מוביל אותו ישר לפעולה." },
  { stat: "19.3%", statLabel: "המרה מתנועת אימייל ממוקדת", text: "לעסק שמייצר לידים ולעסק שלא, ההבדל הוא לרוב לא תקציב הפרסום אלא המקום שאליו שולחים את הגולשים. דף ייעודי ממיר פי כמה מעמוד הבית." },
  { stat: "×3", statLabel: "יותר המרות לדפים שנטענים תוך שנייה", text: "מסר אחד, פעולה אחת ושום דבר שמסיח את הדעת. ככה נראה דף שמביא פניות." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "ידע שיווקי", description: "חוץ מהדף עצמו, אני משתף אתכם במה שלמדתי על מה עובד, מה לא ואיך להוציא ממנו יותר." },
    { number: "02", title: "זמינות אמיתית", description: "אף אחד לא מעביר אתכם לנציג אחרי שהפרויקט נגמר. אתם מדברים איתי ישירות, מקבלים תשובה מהר, ומדברים עם מי שמכיר את הפרויקט הכי טוב." },
  ],
  [
    { number: "03", title: "ליווי טכני מקצה לקצה", description: "דומיין, שרת, חיבורים ואינטגרציות, את כל זה אני לוקח עליי. לא צריך להיות מומחה כדי להשיק דף נחיתה." },
    { number: "04", title: "תמיכה אחרי ההשקה", description: "חודש תמיכה מלא אחרי ההשקה, בלי עלות נוספת. תיקונים, עדכונים קטנים וכל שאלה שעולה." },
  ],
];

export default function LandingPagesContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      <ServiceAmbientBackground />
      <Navbar />
      <SubPageNav />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="דפי נחיתה"
          titleLine2="שמביאים לקוחות"
          description="לכל דף נחיתה שאני בונה יש תפקיד אחד: להפוך גולשים ללקוחות."
          ctaLabel="בואו נבנה את הדף שלכם"
        />
        <WhatIsIt
          title="מה זה דף נחיתה?"
          text="דף נחיתה הוא עמוד שנבנה בשביל פעולה אחת: השארת פרטים, רכישה או הרשמה. אין בו תפריט שמסיח את הדעת ואין קישורים החוצה. כל מה שיש בדף מוביל לאותה פעולה, ובגלל זה הוא מביא יותר פניות מעמוד רגיל באתר."
        />
        <StatsSection title="למה כדאי דף נחיתה" stats={stats} />
        <TypesGrid title="איזה סוג דף מתאים לך?" items={pageTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלי" items={principles} />
        <WhatYouGet title="וזה לא הכול" subtitle="מה מקבלים מעבר לדף עצמו" rows={whatYouGetRows} />
        <ServiceFinalCTA title="רוצים דף נחיתה שבאמת מביא פניות?" />
      </div>

      <Footer light />
    </main>
  );
}
