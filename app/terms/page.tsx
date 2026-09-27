import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME, pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("תנאי שימוש"),
  description: "תנאי השימוש באתר YEYE Digital: קניין רוחני, העבודות המוצגות, אחריות וקישורים חיצוניים.",
};

/**
 * Only rights that exist.
 *
 * The site's own design and code are the studio's, and that is stated plainly.
 * The client work shown here belongs to the clients and appears with their
 * permission — that permission was confirmed for everything currently on the
 * site, and the sentence is written so it stays true as work is added.
 *
 * No warranty, no guarantee of results, no claim about anything the studio does
 * not control. A lawyer should read this before launch.
 */
export default function TermsPage() {
  return (
    <LegalPage title="תנאי שימוש" updated="27 בספטמבר 2026">
      <p>
        הגלישה באתר של {SITE_NAME} ושימוש בו מהווים הסכמה לתנאים שלהלן. הם כתובים בלשון פשוטה, והם
        חלים על כל חלקי האתר.
      </p>

      <h2>מה האתר הזה</h2>
      <p>
        האתר מציג את העבודה של הסטודיו ואת השירותים שהוא מציע, ומאפשר ליצור קשר. התוכן שבו הוא מידע
        כללי, ואינו הצעה מחייבת, אינו התחייבות לתוצאה ואינו ייעוץ מקצועי לעסק מסוים.
      </p>

      <h2>קניין רוחני</h2>
      <p>
        העיצוב של האתר, הקוד שלו, הטקסטים, האיורים, האנימציות והשם {SITE_NAME} הם רכושו של הסטודיו.
        אין להעתיק, לשכפל, להפיץ או ליצור עבודה נגזרת מהם, כולם או חלקם, בלי אישור מראש ובכתב.
      </p>
      <p>
        אפשר, כמובן, לקשר לאתר, לצטט ממנו בציון המקור, ולשתף אותו.
      </p>

      <h2>העבודות והלקוחות שמוצגים</h2>
      <p>
        הפרויקטים, צילומי המסך, שמות הלקוחות והסימנים המסחריים שמוצגים באתר שייכים ללקוחות שלהם והם
        מוצגים באישורם, לצורך הצגת עבודה בלבד. אין בהצגתם משום העברת זכות כלשהי בהם, ואין לעשות בהם
        שימוש שאינו צפייה באתר.
      </p>
      <p>
        אם אתם בעלי זכויות בתוכן שמוצג כאן וברצונכם שהוא יוסר,{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>כתבו לי</a> ואטפל בזה במהירות.
      </p>

      <h2>פנייה דרך האתר</h2>
      <p>
        טופס יצירת הקשר מיועד לפניות אמיתיות בנושא עבודה. אין להשתמש בו לשליחת תוכן פוגעני, פרסומי
        או אוטומטי. פנייה אינה יוצרת התקשרות, וכל עבודה מתחילה בהסכם נפרד.
      </p>

      <h2>אחריות</h2>
      <p>
        האתר מוגש כמות שהוא. אני משתדל שהמידע בו יהיה מדויק ומעודכן ושהאתר יהיה זמין, אבל איני מתחייב
        לכך, ואיני אחראי לנזק שייגרם משימוש בו או מהסתמכות על המידע שבו.
      </p>

      <h2>קישורים לאתרים אחרים</h2>
      <p>
        באתר יש קישורים לאתרים חיצוניים, ובכללם אתרים של לקוחות. אין לי שליטה עליהם ואיני אחראי
        לתוכנם, לזמינותם או למדיניות הפרטיות שלהם.
      </p>

      <h2>שינוי התנאים</h2>
      <p>
        התנאים האלה עשויים להתעדכן. הנוסח שמופיע בעמוד הזה, עם התאריך שלמעלה, הוא הנוסח התקף.
      </p>

      <h2>דין וסמכות שיפוט</h2>
      <p>על תנאים אלה יחולו דיני מדינת ישראל, וסמכות השיפוט הבלעדית נתונה לבתי המשפט בישראל.</p>

      <p>
        ראו גם: <Link href="/privacy">מדיניות פרטיות</Link> ו
        <Link href="/accessibility">הצהרת נגישות</Link>.
      </p>
    </LegalPage>
  );
}
