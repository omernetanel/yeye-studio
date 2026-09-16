"use client";

import { BarChart3, Code2, CreditCard, MessageSquare, Paintbrush, Rocket, ShoppingCart, Smartphone } from "lucide-react";
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
  { icon: ShoppingCart, title: "חוויית קנייה חלקה", description: "מהמוצר ועד התשלום, בלי חיכוך ובלי בלבול. כל שלב בנוי כדי שיקנו." },
  { icon: CreditCard, title: "תשלומים מאובטחים", description: "חיבור ל-Stripe, ל-PayPal ולסליקה ישראלית, עם אבטחה לפי התקנים." },
  { icon: BarChart3, title: "ניהול קל", description: "לוח בקרה פשוט למוצרים, למלאי ולהזמנות. לא צריך ידע טכני." },
  { icon: Smartphone, title: "קודם כול לטלפון", description: "רוב הקניות היום קורות בטלפון, אז משם אני מתחיל." },
];

const storeTypes = [
  { title: "חנות מוצרים פיזיים", description: "ביגוד, אביזרים, מוצרים לבית. חנות עם ניהול מלאי, משלוחים ותשלומים.", use: "מתאים אם יש לכם מוצר פיזי שאתם רוצים למכור אונליין" },
  { title: "מוצרים דיגיטליים", description: "קורסים, קבצים, תוכנה. המכירה אוטומטית, בלי משלוחים ובלי מלאי.", use: "מתאים אם יש לכם ידע או תוכן שאפשר למכור שוב ושוב" },
  { title: "שירותים ומנויים", description: "חיוב חודשי, מנויים, שעות ייעוץ. הלקוחות הקבועים מנוהלים לבד.", use: "מתאים אם אתם מוכרים שירות מתמשך ולא מוצר חד-פעמי" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "הבנת העסק והמוצרים", description: "אני לומד את המוצרים, את הקהל ואת מה שמייחד אתכם מול המתחרים. קודם אסטרטגיית מכירה, ורק אחר כך עיצוב." },
  { number: "02", icon: Paintbrush, title: "עיצוב חוויית הקנייה", description: "דף מוצר שמוכר, עגלה שלא מאבדת לקוחות ותשלום שנגמר בהזמנה." },
  { number: "03", icon: Code2, title: "פיתוח וחיבורים", description: "בונים את החנות עם מערכת ניהול, סליקה, משלוחים ומלאי. הכול עובד מהיום הראשון." },
  { number: "04", icon: Rocket, title: "השקה וליווי", description: "משיקים אחרי בדיקות מלאות, ואני נשאר איתכם חודש כדי לוודא שהכול רץ חלק." },
];

const stats = [
  { stat: "70%+", statLabel: "מהרכישות מתבצעות מהטלפון", text: "הלקוחות שלכם לא יושבים מול מחשב. הם רואים מוצר בטלפון ורוצים לקנות עכשיו. חנות שלא בנויה לנייד מאבדת אותם עוד לפני שראו מחיר." },
  { stat: "24/7", statLabel: "מכירות גם כשאתם לא שם", text: "חנות פיזית תלויה בשעות פתיחה, במיקום ובעובדים. חנות אונליין מוכרת גם כשאתם ישנים, בחופש או עסוקים במשהו אחר." },
  { stat: "×3", statLabel: "יותר מכירות עם חוויה נכונה", text: "לרוב ההבדל בין חנות שמוכרת לחנות שלא הוא החוויה ולא המוצר. ניווט ברור, תמונות טובות ותשלום פשוט יכולים להכפיל ואף לשלש את ההכנסות מאותה כמות גולשים." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "הדרכת ניהול מלאה", description: "אני לא מוסר אתר ונעלם. אני מלמד אתכם לנהל הזמנות, מוצרים ולקוחות עד שזה מרגיש טבעי." },
    { number: "02", title: "זמינות אמיתית", description: "שאלה, תקלה או עדכון קטן? אתם תמיד יודעים עם מי מדברים ומי אחראי על הפרויקט." },
  ],
  [
    { number: "03", title: "ליווי טכני מקצה לקצה", description: "דומיין, אחסון, SSL וסליקה, את כל זה אני מסדר. לא צריך להבין בטכנולוגיה כדי לפתוח חנות." },
    { number: "04", title: "תמיכה אחרי ההשקה", description: "חודש תמיכה מלא אחרי ההשקה, בלי עלות נוספת. תיקונים, עדכונים וכל שאלה שעולה." },
  ],
];

export default function OnlineStoresContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      <ServiceAmbientBackground />
      <Navbar />
      <SubPageNav />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="חנות אונליין שמוכרת,"
          titleLine2="גם כשאתם ישנים"
          description="חנות מעוצבת, מהירה ומאובטחת שהופכת גולשים לקונים."
          ctaLabel="בואו נבנה את החנות שלכם"
        />
        <WhatIsIt
          title="מה זה חנות אונליין?"
          text="חנות אונליין היא סניף של העסק שאף פעם לא נסגר. היא מוכרת ללקוחות מכל מקום ובכל שעה, בלי שמישהו יצטרך לעמוד מאחורי הדלפק. כשהיא בנויה נכון, היא ערוץ המכירה שעובד הכי קשה בעסק."
        />
        <StatsSection title="למה כדאי חנות אונליין" stats={stats} />
        <TypesGrid title="איזה סוג חנות מתאים לך?" items={storeTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלי" items={principles} />
        <WhatYouGet title="וזה לא הכול" subtitle="מה מקבלים מעבר לחנות עצמה" rows={whatYouGetRows} />
        <ServiceFinalCTA title="רוצים חנות שבאמת מוכרת?" />
      </div>

      <Footer light />
    </main>
  );
}
