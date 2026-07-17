"use client";

import { Code2, MessageSquare, Paintbrush, Rocket, Smartphone, Target, Users, Zap } from "lucide-react";
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
  { icon: Target, title: "מטרה אחת ברורה", description: "כל דף נבנה סביב פעולה יחידה — בלי הסחות דעת, בלי תפריטים מתחרים." },
  { icon: Zap, title: "מהירות טעינה", description: "כל שנייה של עיכוב פוגעת בהמרה. אנחנו בונים דפים שטוענים מהר, תמיד." },
  { icon: Smartphone, title: "מובייל קודם", description: "רוב התנועה מגיעה מהטלפון — כך גם אנחנו מתכננים, מההתחלה." },
  { icon: Users, title: "הוכחה חברתית", description: "ממוקם נכון, אמון מלקוחות קודמים יכול להכריע את ההחלטה." },
];

const pageTypes = [
  { title: "איסוף לידים", description: "פרטי קשר תמורת הצעה אמיתית — שיחת ייעוץ, קטלוג, או הצעת מחיר.", use: "מתאים כש: אתה רוצה לבנות רשימת לקוחות פוטנציאליים" },
  { title: "מכירה ישירה", description: "דף ממוקד שמוביל ישר לרכישה — מוצר, שירות, או חבילה.", use: "מתאים כש: יש לך הצעה ברורה ומוכנה לסגירה" },
  { title: "חימום לפני פנייה", description: 'מציג מידע מעמיק ובונה אמון, לפני שמבקש מהמבקר לפעול.', use: 'מתאים כש: התנועה שלך "קרה" וזקוקה להסבר' },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "הבנת המטרה והקהל", description: "לפני שנכתב מילה אחת, אנחנו יושבים איתך ולומדים את העסק לעומק. מי הלקוח האידיאלי שלך? מה הוא מרגיש? מה עוצר אותו מלפעול? התשובות האלה הן הבסיס לכל דף שנבנה." },
  { number: "02", icon: Paintbrush, title: "כתיבת מסר ממוקד", description: "כותבים כותרת שקולעת ישר ללב הבעיה, תיאור שבונה אמון, ו-CTA שמוביל לפעולה. כל מילה נבחרת בכוונה — אין מילות מילוי, אין ז'רגון מיותר." },
  { number: "03", icon: Code2, title: "עיצוב ופיתוח", description: "בונים את הדף מאפס — לא תבנית מוכנה. עיצוב שמתאים לקהל שלך, פיתוח מהיר עם Next.js, וחוויית מובייל מושלמת. כל פיקסל נועד לשרת את המטרה." },
  { number: "04", icon: Rocket, title: "בדיקות, אופטימיזציה והשקה", description: "לפני שהדף עולה לאוויר, בודקים אותו על כל מכשיר ודפדפן, מוודאים מהירות טעינה מיטבית, ומכוונים אחרון אחרון. ביום ההשקה — אנחנו שם." },
];

const stats = [
  { stat: "-7%", statLabel: "על כל שנייה של טעינה", text: "כשמישהו לוחץ על מודעה שלך, יש לו שנייה אחת להחליט אם להישאר. אתר רגיל מציג לו תפריט, עמוד בית, ועשר דרכים לאבד אותו. דף נחיתה עושה דבר אחד: מוביל אותו ישר לפעולה." },
  { stat: "19.3%", statLabel: "המרה מתנועת אימייל ממוקדת", text: "ההבדל בין עסק שמייצר לידים לבין עסק שלא, הוא לרוב לא תקציב הפרסום — זה המקום שאליו אתה שולח את התנועה. תנועה ממוקדת לדף ייעודי ממירה פי כמה מתנועה לעמוד הבית." },
  { stat: "×3", statLabel: "יותר המרות לדפים שנטענים תוך שנייה", text: "דף נחיתה טוב לא רק נראה טוב — הוא בנוי להמיר. מסר אחד, פעולה אחת, ללא הסחות דעת. זה ההבדל בין אתר שנראה טוב לדף שמייצר כסף." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "ידע שיווקי שמגיע איתך", description: "לא מסתפקים בלבנות דף יפה. אנחנו חולקים איתך את הידע שנצבר מעבודה על עשרות פרויקטים — מה עובד, מה לא, ואיך למקסם את התוצאות מהדף שבנינו." },
    { number: "02", title: "זמינות אמיתית", description: "לא עוברים לפקיד אחר אחרי שהפרויקט נסגר. תוכלו לפנות אלינו ישירות, לקבל מענה מהיר, ולדעת שמישהו שמכיר את הפרויקט שלך עומד מאחוריו." },
  ],
  [
    { number: "03", title: "ליווי טכני מקצה לקצה", description: "דומיין, שרת, חיבורים, אינטגרציות — מטפלים בכל הבירוקרטיה הדיגיטלית. לא צריך להיות מומחה כדי להשיק דף נחיתה מקצועי." },
    { number: "04", title: "תמיכה לאחר ההשקה", description: "חודש תמיכה מלאה אחרי ההשקה, ללא עלות נוספת. תיקונים, עדכונים קטנים, שאלות — אנחנו כאן כדי לוודא שהכל עובד בדיוק כמו שצריך." },
  ],
];

export default function LandingPagesContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <ScrollToTop />
      <ServiceAmbientBackground />
      <Navbar />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="דפי נחיתה שממירים,"
          titleLine2="לא רק נראים טוב"
          description="כל דף נחיתה שאנחנו בונים נועד למטרה אחת: להפוך מבקרים ללקוחות."
          ctaLabel="בוא נבנה את הדף שלך"
        />
        <WhatIsIt
          title="מה זה דף נחיתה?"
          text="דף נחיתה הוא עמוד עצמאי שמטרתו פעולה אחת וברורה — השארת פרטים, רכישה, או הרשמה. בשונה מאתר מלא, אין בו תפריט מסיח או קישורים יוצאים. כל אלמנט בדף מכוון למטרה אחת, מה שהופך אותו לכלי המרה ולא רק לעמוד תדמית."
        />
        <StatsSection title="למה דף נחיתה הוא חובה" stats={stats} />
        <TypesGrid title="איזה סוג דף מתאים לך?" items={pageTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלנו" items={principles} />
        <WhatYouGet title="וזה לא הכל" subtitle="כל פרויקט מגיע עם שכבת שירות שמעטים מציעים" rows={whatYouGetRows} />
        <ExamplesPlaceholder title="דוגמאות מהעבודה שלנו" labelPrefix="דף נחיתה" />
        <ServiceFinalCTA title="רוצה דף נחיתה שבאמת ממיר?" />
      </div>

      <Footer />
    </main>
  );
}
