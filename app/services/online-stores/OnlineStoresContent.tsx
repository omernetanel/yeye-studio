"use client";

import { BarChart3, Code2, CreditCard, MessageSquare, Paintbrush, Rocket, ShoppingCart, Smartphone } from "lucide-react";
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
  { icon: ShoppingCart, title: "חוויית קנייה חלקה", description: "מהמוצר לתשלום — בלי חיכוך, בלי בלבול. כל שלב בתהליך נבנה כדי להמיר." },
  { icon: CreditCard, title: "תשלומים מאובטחים", description: "אינטגרציה עם Stripe, PayPal וסליקה ישראלית. אבטחה ברמת הבנקים." },
  { icon: BarChart3, title: "ניהול קל", description: "לוח בקרה פשוט לניהול מוצרים, מלאי והזמנות — בלי צורך בידע טכני." },
  { icon: Smartphone, title: "מובייל קודם", description: "מעל 70% מהרכישות מתבצעות מהטלפון. אנחנו בונים לזה מההתחלה." },
];

const storeTypes = [
  { title: "חנות מוצרים פיזיים", description: "ביגוד, אביזרים, מוצרי בית — חנות עם ניהול מלאי, משלוחים ותשלומים.", use: "מתאים כש: יש לך מוצר פיזי שאתה רוצה למכור אונליין" },
  { title: "מוצרים דיגיטליים", description: "קורסים, קבצים, תוכנה — מכירה אוטומטית ללא משלוח ולא מלאי.", use: "מתאים כש: יש לך ידע או תוכן שאפשר למכור שוב ושוב" },
  { title: "שירותים ומנויים", description: "חיוב חודשי, מנויים, שעות יעוץ — ניהול לקוחות קבועים בצורה אוטומטית.", use: "מתאים כש: אתה מוכר שירות מתמשך ולא מוצר חד פעמי" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "הבנת העסק והמוצרים", description: "לומדים את הקטגוריות, קהל היעד, ומה מייחד אותך מהמתחרים. בונים אסטרטגיית מכירה לפני שנוגעים בעיצוב." },
  { number: "02", icon: Paintbrush, title: "עיצוב חוויית קנייה", description: "עיצוב ממוקד המרה — דף מוצר שמוכר, עגלה שלא מאבדת לקוחות, ותהליך תשלום שמסיים עסקאות." },
  { number: "03", icon: Code2, title: "פיתוח ואינטגרציות", description: "בניית החנות עם מערכת ניהול, חיבור לסליקה, משלוחים ומלאי. הכל עובד — מהרגע הראשון." },
  { number: "04", icon: Rocket, title: "השקה וליווי", description: "השקה מבוקרת עם בדיקות מלאות. חודש תמיכה אחרי ההשקה לוודא שהכל רץ חלק." },
];

const stats = [
  { stat: "70%+", statLabel: "מהרכישות מתבצעות מהטלפון", text: "הלקוח שלך לא יושב מול מחשב. הוא גולש בסלולר, רואה מוצר שמעניין אותו, ורוצה לקנות עכשיו. חנות שלא בנויה למובייל מאבדת את רוב הלקוחות שלה עוד לפני שהם ראו מחיר." },
  { stat: "24/7", statLabel: "מכירות ללא נוכחות", text: "חנות פיזית מוגבלת לשעות פתיחה, לאזור גיאוגרפי, ולכוח אדם. חנות אונליין מוכרת תוך כדי שאתה ישן, מטייל, או עובד על משהו אחר. זו ההכנסה הפסיבית שכל עסק צריך." },
  { stat: "×3", statLabel: "יותר מכירות עם UX נכון", text: "ההבדל בין חנות שממירה לחנות שלא הוא לא המוצר — זה החוויה. ניווט ברור, תמונות איכותיות, ותהליך תשלום פשוט יכולים להכפיל ולשלש את ההכנסה מאותה תנועה." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "הדרכת ניהול מלאה", description: "לא מעבירים לך אתר ונעלמים. מלמדים אותך לנהל הזמנות, מוצרים ולקוחות — עד שאתה מרגיש בנוח לגמרי." },
    { number: "02", title: "זמינות אמיתית", description: "שאלה, בעיה, או עדכון קטן — אנחנו כאן. תמיד תדע עם מי אתה מדבר ומי אחראי לפרויקט שלך." },
  ],
  [
    { number: "03", title: "ליווי טכני מקצה לקצה", description: "דומיין, אחסון, SSL, חיבור לסליקה — מסדרים הכל. לא צריך להבין טכנולוגיה כדי לפתוח חנות מקצועית." },
    { number: "04", title: "תמיכה לאחר ההשקה", description: "חודש תמיכה מלאה אחרי ההשקה, ללא עלות נוספת. תיקונים, עדכונים ושאלות — אנחנו שם." },
  ],
];

export default function OnlineStoresContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <ScrollToTop />
      <ServiceAmbientBackground />
      <Navbar />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="חנות אונליין שמוכרת,"
          titleLine2="גם כשאתה ישן"
          description="חנות מעוצבת, מהירה ומאובטחת שמביאה מכירות — לא רק ביקורים."
          ctaLabel="בוא נבנה את החנות שלך"
        />
        <WhatIsIt
          title="מה זה חנות אונליין?"
          text={'חנות אונליין היא הנציגות הדיגיטלית של העסק שלך — פועלת 24/7, מוכרת ללקוחות מכל מקום, ולא דורשת נוכחות פיזית. מה שנראה כמו "אתר" הוא בעצם מכונת מכירות שעובדת עבורך כל הזמן.'}
        />
        <StatsSection title="למה חנות אונליין היא חובה" stats={stats} />
        <TypesGrid title="איזה סוג חנות מתאים לך?" items={storeTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלנו" items={principles} />
        <WhatYouGet title="וזה לא הכל" subtitle="כל פרויקט מגיע עם שכבת שירות שמעטים מציעים" rows={whatYouGetRows} />
        <ExamplesPlaceholder title="דוגמאות מהעבודה שלנו" labelPrefix="חנות אונליין" />
        <ServiceFinalCTA title="רוצה חנות שבאמת מוכרת?" />
      </div>

      <Footer />
    </main>
  );
}
