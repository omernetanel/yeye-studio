"use client";

import { Code2, Database, LayoutDashboard, Lock, MessageSquare, Paintbrush, Rocket, Zap } from "lucide-react";
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
  { icon: LayoutDashboard, title: "ממשק פשוט", description: "מערכת מורכבת לא חייבת להיות קשה לשימוש. בונים ממשקים שאפשר להבין תוך דקות." },
  { icon: Database, title: "נתונים בזמן אמת", description: "מידע עדכני תמיד — הזמנות, לקוחות, ביצועים. הכל במקום אחד, תמיד מסונכרן." },
  { icon: Lock, title: "אבטחה מלאה", description: "הרשאות לפי תפקיד, גיבויים אוטומטיים, וחיבור מוצפן. הנתונים שלך מוגנים." },
  { icon: Zap, title: "ביצועים גבוהים", description: "מערכת שעובדת מהר גם עם אלפי רשומות. בנויה לגדול יחד עם העסק." },
];

const systemTypes = [
  { title: "ניהול לקוחות ותורים", description: "מערכת לקביעת תורים, מעקב אחרי לקוחות, ושליחת תזכורות אוטומטיות.", use: "מתאים כש: יש לך קליניקה, סטודיו, או כל עסק מבוסס פגישות" },
  { title: "לוח בקרה עסקי", description: "גרפים, נתוני מכירות, מלאי ודוחות — כל מה שצריך לקבל החלטות מהירות.", use: "מתאים כש: אתה רוצה לראות את המצב העסקי בלחיצה אחת" },
  { title: "מערכת ניהול פנימית", description: "כלי עבודה לצוות — ניהול משימות, לידים, פרויקטים ותקשורת פנימית.", use: "מתאים כש: יש לך צוות ואתה רוצה שכולם יעבדו מאותו מקום" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "מיפוי תהליכים", description: "יושבים יחד ומבינים איך העסק עובד — אילו נתונים חשובים, אילו תהליכים חוזרים, ואיפה הכי הרבה זמן מתבזבז." },
  { number: "02", icon: Paintbrush, title: "עיצוב הממשק", description: "בונים ממשק שמותאם לאנשים שישתמשו בו — פשוט, ברור, ומהיר. לא צריך הדרכה ארוכה כדי להתחיל." },
  { number: "03", icon: Code2, title: "פיתוח ואינטגרציות", description: "בונים את המערכת עם כל החיבורים הנדרשים — תשלומים, יומן, מייל, ו-WhatsApp. הכל מחובר ועובד." },
  { number: "04", icon: Rocket, title: "השקה והדרכה", description: "מעבירים את הצוות שלך על המערכת עד שכולם מרגישים בנוח. תמיכה מלאה בחודש הראשון." },
];

const stats = [
  { stat: "4.5h", statLabel: "שעות בשבוע שנחסכות עם ניהול דיגיטלי", text: "עסק שמנהל לקוחות, תורים ומלאי בגיליונות אקסל מבזבז שעות יקרות על עבודה ידנית. מערכת ניהול ייעודית אוטומטית תהליכים, מפחיתה טעויות, ומחזירה לך את הזמן לעסוק בעסק עצמו." },
  { stat: "×2", statLabel: "פחות טעויות עם תהליכים אוטומטיים", text: "העברת מידע ידנית בין מערכות שונות היא מקור מספר אחד לטעויות יקרות. מערכת ניהול אחת שמחברת הכל — לקוחות, הזמנות, תשלומים — מבטיחה שהמידע תמיד מדויק ועדכני." },
  { stat: "100%", statLabel: "שקיפות עסקית בזמן אמת", text: "כמה לקוחות חדשים החודש? מה המלאי הנוכחי? איזה שירות הכי פופולרי? עם לוח בקרה ייעודי — התשובות לשאלות האלה נמצאות בלחיצה אחת, לא בחיפוש בגיליונות ומיילים." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "הדרכת צוות מלאה", description: "לא מעבירים לך מערכת ונעלמים. מדריכים את כל הצוות עד שכולם עובדים בביטחון ובמהירות." },
    { number: "02", title: "זמינות אמיתית", description: "שאלה, בעיה, או פיצ'ר חדש — אנחנו כאן. תמיד תדע עם מי אתה מדבר ומי אחראי למערכת שלך." },
  ],
  [
    { number: "03", title: "ליווי טכני מקצה לקצה", description: "שרת, דומיין, גיבויים, אבטחה — מסדרים הכל. לא צריך להיות מהנדס כדי להפעיל מערכת מקצועית." },
    { number: "04", title: "תמיכה לאחר ההשקה", description: "חודש תמיכה מלאה אחרי ההשקה. תיקונים, שיפורים ושאלות — אנחנו שם כדי לוודא שהמערכת עובדת מושלם." },
  ],
];

export default function DashboardsContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <ScrollToTop />
      <ServiceAmbientBackground />
      <Navbar />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="מערכת ניהול שעובדת"
          titleLine2="בדיוק כמו העסק שלך"
          description="דשבורד וכלי ניהול פנימיים שמסדרים את העסק — במקום אחד, בממשק פשוט, בלי להסתמך על גיליונות אקסל."
          ctaLabel="בוא נבנה את המערכת שלך"
        />
        <WhatIsIt
          title="מה זה מערכת ניהול?"
          text="מערכת ניהול היא כלי עבודה פנימי שבנוי במיוחד לעסק שלך. בניגוד לתוכנות גנריות שצריך להתאים לעצמך, אנחנו בונים בדיוק מה שצריך — לא יותר, לא פחות. התוצאה היא מערכת שכולם בצוות שלך ישתמשו בה כי היא פשוטה ומדויקת."
        />
        <StatsSection title="למה מערכת ניהול היא חובה" stats={stats} />
        <TypesGrid title="איזה סוג מערכת מתאים לך?" items={systemTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלנו" items={principles} />
        <WhatYouGet title="וזה לא הכל" subtitle="כל פרויקט מגיע עם שכבת שירות שמעטים מציעים" rows={whatYouGetRows} />
        <ExamplesPlaceholder title="דוגמאות מהעבודה שלנו" labelPrefix="מערכת ניהול" />
        <ServiceFinalCTA title="רוצה מערכת שעובדת בשבילך?" />
      </div>

      <Footer />
    </main>
  );
}
