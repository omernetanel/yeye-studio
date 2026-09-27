import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME, pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("תנאי שימוש"),
  description: "תנאי השימוש באתר YEYE Digital: מה האתר מציג, זכויות בתוכן, העבודות המוצגות ואחריות.",
  alternates: { canonical: "/terms" },
};

/**
 * TERMS FOR A PORTFOLIO SITE, and nothing wider than that.
 *
 * THE ONE THING NOT TO UNDO: this page does not decide who owns a client
 * project. An earlier draft said the work "belongs to the clients", which is a
 * split of rights made in a public document rather than in an agreement, and it
 * could be used against the studio. The wording now says only that a project may
 * contain rights of several parties and that the split is set by law and by the
 * specific agreement. Nothing here transfers a right in either direction.
 *
 * ALSO DELIBERATE:
 * - No blanket exclusion of liability. Reasonable effort, no promise of
 *   continuous availability, and any limitation applies only as far as the law
 *   allows.
 * - Quoting with credit is fair use under the law, not a licence to copy. The
 *   sentence saying so is there because the previous draft read as permission.
 * - The claims paragraph promises examination, not removal, and no timeframe.
 * - "Data and examples" exists because the service pages carry figures. It is
 *   not a substitute for those figures having a basis; that audit is separate.
 * - No payment, cancellation, account, arbitration, indemnity or cookie terms.
 *   Nothing on this site does any of those things.
 *
 * Everything between the studio and a client - scope, approvals, revisions,
 * source files, copyright, third party components, portfolio rights, the
 * support month - belongs in the client agreement, not here.
 *
 * A lawyer should read this before launch.
 */
export default function TermsPage() {
  return (
    <LegalPage title="תנאי שימוש" updated="27 בספטמבר 2026">
      <p>
        האתר מופעל על ידי עומר, עוסק עצמאי הפועל תחת המותג {SITE_NAME}. התנאים שלהלן חלים על השימוש
        באתר ועל התוכן שבו.
      </p>

      <h2>מה האתר הזה</h2>
      <p>
        האתר מציג עבודות ופרויקטים, את השירותים שאני מציע ומידע עליי ועל {SITE_NAME}, ומאפשר ליצור
        קשר. אין באתר רכישה, תשלום, חשבון משתמש או הזמנה.
      </p>
      <p>
        התוכן באתר הוא מידע כללי. הצגת שירות אינה הצעה מחייבת ואינה התחייבות לקבל עבודה, ופנייה דרך
        האתר אינה יוצרת התקשרות. היקף העבודה, התוצרים, לוחות הזמנים, הזכויות, המחיר ושאר התנאים
        נקבעים בהתקשרות הספציפית מול הלקוח, ותוכן האתר אינו מחליף אותה.
      </p>

      <h2>זכויות בתוכן ובעיצוב</h2>
      <p>
        זכויות היוצרים בעיצוב האתר, בטקסטים, באיורים, באנימציות ובקוד המקורי שנוצרו עבור {SITE_NAME}{" "}
        שמורות בהתאם לדין, בכפוף לזכויות של לקוחות וצדדים שלישיים. השם {SITE_NAME} והלוגו משמשים
        כמיתוג של הפעילות, וכל זכות הקיימת בהם בהתאם לדין שמורה.
      </p>
      <p>
        חלק מהתכנים והרכיבים באתר עשויים להיות כפופים לזכויות או לרישיונות של צדדים שלישיים. אין
        בתנאים אלה כדי לגרוע מזכויותיהם או מתנאי הרישיון החלים עליהם.
      </p>

      <h2>מה מותר לעשות באתר</h2>
      <p>
        אפשר לגלוש באתר, לקשר אליו, לשתף אותו ולעשות בו שימוש הוגן בהתאם לדין, לרבות ציטוט סביר תוך
        ציון המקור.
      </p>
      <p>
        אין להעתיק, לשכפל, להפיץ, לפרסם או ליצור יצירה נגזרת מתוכן האתר או מחלקים ממנו, לרבות עיצוב,
        טקסטים, תמונות, וידאו, אנימציות, איורים, קבצים או קוד, אלא באישור מראש ובכתב. ציון מקור אינו
        מהווה אישור כזה.
      </p>

      <h2>העבודות המוצגות</h2>
      <p>
        העבודות המוצגות באתר עשויות לכלול חומרים וזכויות השייכים לי, ללקוחות ולצדדים שלישיים, לרבות
        לוגואים, סימנים מסחריים, תמונות ותוכן של הלקוח. כל הזכויות שמורות לבעליהן.
      </p>
      <p>
        עבודות של לקוחות מוצגות כאן באישורם ולשם הצגת עבודה בלבד. הצגת עבודה באתר אינה מעניקה למבקר
        זכות כלשהי בה או בחומרים הכלולים בה, ואינה קובעת או משנה את חלוקת הזכויות ביני לבין הלקוח,
        שנקבעת בהתאם לדין ולהסכם מולו.
      </p>

      <h2>טענות לגבי תוכן שמוצג באתר</h2>
      <p>
        אם יש לכם טענה לזכויות בתוכן שמופיע באתר, אפשר לפנות אליי בדוא״ל{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ולפרט במה מדובר. הפנייה תיבחן בהתאם
        לנסיבות ולדין.
      </p>

      <h2>נתונים ודוגמאות</h2>
      <p>
        נתונים ודוגמאות המופיעים באתר נועדו להציג מידע כללי ולהמחיש מגמות ועקרונות בתחום. נתונים
        כלליים אינם מהווים התחייבות לתוצאה בפרויקט מסוים, ותוצאות עשויות להשתנות בהתאם לנסיבות.
      </p>

      <h2>פנייה דרך האתר</h2>
      <p>
        טופס יצירת הקשר מיועד לפניות בנושא השירותים והעבודה. אין להשתמש בו לשליחת דואר זבל, לשליחה
        אוטומטית, לתוכן בלתי חוקי, או לניסיון לשבש את פעולת האתר או לפגוע בו.
      </p>
      <p>
        פרטים שנמסרים בטופס מטופלים כמתואר ב<Link href="/privacy">מדיניות הפרטיות</Link>.
      </p>

      <h2>תוכן חיצוני ותצוגות חיות</h2>
      <p>
        באתר יש קישורים לאתרים חיצוניים, ובעמודי העבודות אפשר לטעון תצוגה חיה של אתר לקוח בתוך
        העמוד, בלחיצה מפורשת שלכם. אין לי שליטה על התוכן של אותם אתרים, על זמינותם, על שינויים
        שנעשים בהם או על השירותים שהם מספקים, ואיני אחראי להם. השימוש בהם כפוף לתנאים ולמדיניות
        שלהם.
      </p>

      <h2>זמינות האתר ועדכון תכניו</h2>
      <p>
        אני משתדל שהמידע באתר יהיה תקין ועדכני, אך ייתכנו בו טעויות או אי דיוקים. העבודות, השירותים,
        התכנים והמבנה של האתר עשויים להשתנות מעת לעת, ואין התחייבות שהאתר יהיה זמין ברציפות או
        שתוכן מסוים יישאר בו.
      </p>
      <p>ככל שיש בתנאים אלה הגבלה של אחריות, היא תחול רק במידה המותרת לפי הדין.</p>

      <h2>שינוי התנאים</h2>
      <p>
        התנאים עשויים להתעדכן. הנוסח שמופיע בעמוד הזה, עם תאריך העדכון שבראשו, הוא הנוסח התקף.
      </p>

      <h2>דין</h2>
      <p>על תנאים אלה ועל השימוש באתר יחולו דיני מדינת ישראל.</p>

      <p>
        ראו גם: <Link href="/privacy">מדיניות פרטיות</Link> ו
        <Link href="/accessibility">הצהרת נגישות</Link>.
      </p>
    </LegalPage>
  );
}
