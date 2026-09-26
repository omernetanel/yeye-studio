"use client";

import { Code2, MessageSquare, Monitor, Paintbrush, Rocket, Shield, Star, TrendingUp } from "lucide-react";
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
  { icon: Monitor, title: "עיצוב שמייצג אתכם", description: "בלי תבניות. כל אתר מעוצב מאפס כדי לשקף את העסק כמו שהוא." },
  { icon: Shield, title: "אמינות ואבטחה", description: "SSL, גיבויים אוטומטיים וטעינה מהירה. אתר איטי נראה לא מקצועי." },
  { icon: TrendingUp, title: "בנוי לצמוח", description: "קל להוסיף שירותים, עמודים ותכנים ככל שהעסק גדל." },
  { icon: Star, title: "חוויית גלישה", description: "גולש שנעים לו באתר נשאר יותר, סומך יותר, ובסוף מתקשר." },
];

const siteTypes = [
  { title: "עסקים מקומיים", description: "רופאים, עורכי דין, יועצים. אתר שבונה אמון ומביא פניות מהאזור.", use: "מתאים אם מחפשים אתכם בגוגל לפי אזור" },
  { title: "חברות ועסקים", description: "נוכחות דיגיטלית ברמה גבוהה שמציגה את הצוות, השירותים וההישגים.", use: "מתאים אם אתם צריכים להיראות גדולים ואמינים מול לקוחות עסקיים" },
  { title: "פרילנסרים ומותגים אישיים", description: "תיק עבודות שמוכר בשבילכם, גם כשאתם לא זמינים לענות.", use: "מתאים אם הכישרון שלכם הוא המוצר ואתם רוצים שיראו אותו" },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "היכרות ואפיון", description: "אני לומד את העסק, את הקהל, את המתחרים ואת היעדים, ומגדיר את המסר לפני שמתחילים לעצב." },
  { number: "02", icon: Paintbrush, title: "עיצוב", description: "שפה ויזואלית שמשקפת את העסק: צבעים, טיפוגרפיה ופריסה. לכל החלטה יש סיבה." },
  { number: "03", icon: Code2, title: "פיתוח", description: "קוד נקי, טעינה מהירה, SEO בסיסי ואתר שעובד טוב בטלפון. בנוי להחזיק שנים." },
  { number: "04", icon: Rocket, title: "השקה וליווי", description: "עולים לאוויר אחרי בדיקות מלאות, ואני מלמד אתכם לעדכן תכנים לבד." },
];

const stats = [
  { stat: "75%", statLabel: "מהגולשים שופטים אמינות לפי העיצוב", text: "מי שמחפש שירות בגוגל מסתכל על האתר שלכם לפני שהוא מתקשר. אתר ישן או איטי אומר לו הכול. לא מספיק להגיד שאתם מקצועיים, צריך שזה ייראה ככה." },
  { stat: "57%", statLabel: "לא ימליצו על עסק עם אתר גרוע בטלפון", text: "מי שנכנס מהנייד ורואה אתר שלא מתאים את עצמו למסך פשוט לא חוזר. אתר תדמית טוב קודם כול נראה טוב בכל מסך." },
  { stat: "88%", statLabel: "לא יחזרו לאתר אחרי חוויה גרועה", text: "יש הזדמנות אחת לרושם ראשוני. אתר שנטען לאט, שקשה להתמצא בו או שלא ברור מה הוא רוצה, מאבד לקוחות. אתר טוב מחזיר את ההשקעה בכל פנייה שהוא מביא." },
];

const whatYouGetRows = [
  [
    { number: "01", title: "הדרכת ניהול תוכן", description: "אני מלמד אתכם לעדכן טקסטים, תמונות ועמודים לבד, בלי לפנות אליי על כל שינוי קטן." },
    { number: "02", title: "זמינות אמיתית", description: "יש שאלה או משהו לעדכן? תמיד ברור עם מי מדברים ומי אחראי על הפרויקט." },
  ],
  [
    { number: "03", title: "ליווי טכני מקצה לקצה", description: "דומיין, אחסון ו-SSL, את כל זה אני מסדר. לא צריך להבין בטכנולוגיה כדי להשיק אתר." },
    { number: "04", title: "תמיכה אחרי ההשקה", description: "חודש תמיכה מלא אחרי ההשקה, בלי עלות נוספת. תיקונים, עדכונים וכל שאלה." },
  ],
];

export default function BusinessSitesContent() {
  return (
    <main id="main" className="relative min-h-screen overflow-hidden bg-white">
      <ServiceAmbientBackground />
      <Navbar />
      <SubPageNav />

      <div className="relative z-10">
        <ServiceHero
          titleLine1="אתר תדמית שגורם"
          titleLine2="ללקוחות לסמוך עליכם"
          description="הרושם הראשון נוצר אונליין. אתר תדמית טוב הוא ההבדל בין לקוח שפונה ללקוח שממשיך לגלול."
          ctaLabel="בואו נבנה את האתר שלכם"
        />
        <WhatIsIt
          title="מה זה אתר תדמית?"
          text="אתר תדמית הוא הפנים של העסק ברשת. הוא לא מוכר ישירות. הוא בונה אמון, מראה מה אתם יודעים לעשות וגורם ללקוחות לפנות. לרוב זה המקום הראשון שבו מחליטים אם לסמוך עליכם."
        />
        <StatsSection title="למה כדאי אתר תדמית" stats={stats} />
        <TypesGrid title="איזה סוג אתר מתאים לך?" items={siteTypes} />
        <ProcessTimeline title="איך זה עובד?" steps={processSteps} />
        <PrinciplesGrid title="העקרונות שלי" items={principles} />
        <WhatYouGet title="וזה לא הכול" subtitle="מה מקבלים מעבר לאתר עצמו" rows={whatYouGetRows} />
        <ServiceFinalCTA title="רוצים אתר שגורם ללקוחות לסמוך עליכם?" />
      </div>

      <Footer light />
    </main>
  );
}
