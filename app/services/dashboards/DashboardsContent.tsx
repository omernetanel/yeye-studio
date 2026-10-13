"use client";

import { Code2, MessageSquare, Paintbrush, Rocket } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import ServiceAmbientBackground from "@/components/services/ServiceAmbientBackground";
import ServiceHero, { type ServiceWorkItem } from "@/components/services/ServiceHero";
import WhatIsIt from "@/components/services/WhatIsIt";
import StatsSection from "@/components/services/StatsSection";
import TypesGrid from "@/components/services/TypesGrid";
import ProcessTimeline from "@/components/services/ProcessTimeline";
import WhatYouGet from "@/components/services/WhatYouGet";
import ServiceFinalCTA from "@/components/services/ServiceFinalCTA";



const systemTypes = [
  { title: "ניהול לקוחות ותורים", description: "קביעת תורים, מעקב אחרי לקוחות ותזכורות שנשלחות לבד.", use: "מתאים אם יש לכם קליניקה, סטודיו או כל עסק שעובד עם פגישות" },
  { title: "לוח בקרה עסקי", description: "גרפים, מכירות, מלאי ודוחות. כל מה שצריך כדי להחליט מהר.", use: "מתאים אם אתם רוצים לראות את מצב העסק במבט אחד" },
  { title: "מערכת ניהול פנימית", description: "כלי עבודה לצוות: משימות, לידים, פרויקטים ותקשורת פנימית.", use: "מתאים אם יש לכם צוות ואתם רוצים שכולם יעבדו מאותו מקום" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "מיפוי תהליכים", description: "אנחנו יושבים ואני לומד איך העסק עובד: אילו נתונים חשובים, מה חוזר על עצמו, ואיפה הולך הכי הרבה זמן." },
  { number: "02", icon: Paintbrush, title: "עיצוב הממשק", description: "ממשק שמותאם לאנשים שיעבדו איתו: פשוט, ברור ומהיר. לא צריך הדרכה ארוכה כדי להתחיל." },
  { number: "03", icon: Code2, title: "פיתוח וחיבורים", description: "אני בונה את המערכת עם כל החיבורים שצריך: תשלומים, יומן, מייל ו-WhatsApp. הכול מחובר ועובד." },
  { number: "04", icon: Rocket, title: "השקה והדרכה", description: "אני עובר עם הצוות שלכם על המערכת עד שכולם מרגישים בנוח, ונשאר לתמיכה טכנית בחודש הראשון." },
];

const stats = [
  { stat: "לבד", statLabel: "העבודה החוזרת נעשית בלי שתיגעו בה", text: "עסק שמנהל לקוחות, תורים ומלאי באקסל מבזבז שעות על עבודה ידנית. מערכת ייעודית עושה את החלק החוזר לבד, מקטינה טעויות ומחזירה לכם זמן לעסק עצמו." },
  { stat: "מקור אחד", statLabel: "בלי העתקה ידנית בין מערכות", text: "העתקה ידנית של מידע בין מערכות היא אחד המקורות הנפוצים לטעויות יקרות. כשלקוחות, הזמנות ותשלומים יושבים במערכת אחת, קל יותר לשמור על המידע מסודר ומעודכן." },
  { stat: "בזמן אמת", statLabel: "תמונת מצב של העסק בלחיצה", text: "כמה לקוחות חדשים היו החודש? מה יש במלאי? איזה שירות הכי מבוקש? עם לוח בקרה משלכם התשובות נמצאות בלחיצה, ולא מפוזרות בין גיליונות ומיילים." },
];

// The management system the site has a page for.
const work: ServiceWorkItem[] = [
  {
    name: "LYNKO",
    href: "/projects/lynko",
    piece: {
      src: "/images/projects/lynkosass.webp",
      alt: "מסך ניהול התורים של LYNKO",
      width: 1920,
      height: 1080,
    },
  },
];

const whatYouGetRows = [
  [
    { number: "01", title: "הדרכת צוות מלאה", description: "אני לא מוסר מערכת ונעלם. אני מדריך את כל הצוות עד שכולם עובדים איתה בביטחון." },
    { number: "02", title: "זמינות אמיתית", description: "שאלה או צורך בפיצ'ר חדש? פשוט כותבים לי. תמיד ברור עם מי מדברים ומי אחראי על המערכת." },
  ],
  [
    { number: "03", title: "ליווי טכני מקצה לקצה", description: "שרת, דומיין, גיבויים ואבטחה, הכול מסודר מהצד שלי. לא צריך להיות מהנדסים כדי להפעיל מערכת." },
    { number: "04", title: "חודש תמיכה טכנית לאחר ההשקה", description: "תיקון תקלות ובאגים במה שסוכם ונמסר בפרויקט, ללא עלות נוספת." },
  ],
];

export default function DashboardsContent() {
  return (
    <main id="main" className="relative min-h-screen overflow-hidden bg-white">
      <ServiceAmbientBackground />
      <Navbar />
      <SubPageNav bare />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="מערכת ניהול שעובדת"
          titleLine2="בדיוק כמו העסק שלכם"
          description="דשבורד וכלי ניהול פנימיים שמרכזים את העסק במקום אחד, בממשק פשוט ובלי גיליונות אקסל."
          ctaLabel="בואו נבנה את המערכת שלכם"
          work={work}
        />
        <WhatIsIt
          title="מה זה מערכת ניהול?"
          text="מערכת ניהול היא כלי עבודה פנימי שנבנה בשביל העסק שלכם. במקום להתאים את עצמכם לתוכנה גנרית, מקבלים בדיוק את מה שצריך. וכשמערכת פשוטה ומדויקת, כל הצוות באמת משתמש בה."
        />
        <StatsSection title="למה כדאי מערכת ניהול" stats={stats} />
        <TypesGrid title="איזה סוג מערכת מתאים לך?" items={systemTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <WhatYouGet title="וזה לא הכול" subtitle="מה מקבלים מעבר למערכת עצמה" rows={whatYouGetRows} />
        <ServiceFinalCTA title="רוצים מערכת שעובדת בשבילכם?" />
      </div>

      <Footer light />
    </main>
  );
}
