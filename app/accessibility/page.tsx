import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME, WHATSAPP_NUMBER, pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("הצהרת נגישות"),
  description: "מה נעשה כדי שהאתר של YEYE Digital יהיה נגיש, מה עדיין לא מושלם, ואיך לפנות בנושא.",
  alternates: { canonical: "/accessibility" },
};

/**
 * WHAT WE CAN ACTUALLY SAY, and nothing beyond it.
 *
 * This page does not claim compliance with the Israeli standard or with any
 * WCAG level, because no audit has been carried out that would support such a
 * claim. It says what was built, what is known to be missing, and how to reach
 * a person about it — which is the part that helps a reader who is stuck.
 *
 * Whether a formal declaration is required by law here, and in what wording,
 * is a question for a lawyer. The list of gaps below is deliberately honest;
 * every item on it was measured in this codebase.
 */
export default function AccessibilityPage() {
  return (
    <LegalPage title="הצהרת נגישות" updated="27 בספטמבר 2026">
      <p>
        האתר של {SITE_NAME} נבנה כך שיהיה אפשר להשתמש בו במגוון רחב של דרכים: עם מקלדת בלבד, עם
        תוכנת הקראה, עם הגדלת טקסט של הדפדפן, ועם העדפה של פחות תנועה. העמוד הזה מתאר מה נעשה בפועל,
        מה עדיין לא מושלם, ואיך לפנות אליי אם משהו לא עובד.
      </p>

      <h2>מה נעשה באתר</h2>
      <ul>
        <li>
          <strong>תפריט נגישות</strong> בפינה השמאלית התחתונה, שמאפשר להגביר ניגודיות, לעצור את כל
          התנועה באתר, ולהדגיש קישורים בקו תחתון. הבחירה נשמרת בדפדפן לביקורים הבאים.
        </li>
        <li>
          <strong>כיבוד ההעדפה של מערכת ההפעלה.</strong> מי שהגדיר במחשב או בטלפון שהוא מעדיף פחות
          תנועה מקבל את האתר בלי אנימציות ובלי גלילה מונעת־תנועה, עם אותו תוכן בדיוק.
        </li>
        <li>
          <strong>ניווט מקלדת מלא</strong>, כולל קישור דילוג לתוכן בתחילת כל עמוד, וסימון ברור של
          המקום שבו נמצא המיקוד.
        </li>
        <li>
          <strong>טפסים מתויגים</strong>: לכל שדה יש שם שנקרא בתוכנת הקראה, והודעות הצלחה ושגיאה
          מוכרזות.
        </li>
        <li>
          <strong>טקסט אמיתי ולא תמונות של טקסט</strong>, מבנה כותרות הגיוני, וטקסט חלופי לתמונות
          שנושאות מידע.
        </li>
        <li>
          <strong>ניגודיות</strong>: צבעי הטקסט באתר נבדקו מול הרקע שמאחוריהם.
        </li>
      </ul>

      <h2>מה עדיין לא מושלם</h2>
      <p>
        האתר לא עבר בדיקת נגישות חיצונית, ולכן איני מצהיר על עמידה בתקן ישראלי או ברמה מסוימת של
        WCAG. אלה הדברים שידועים לי:
      </p>
      <ul>
        <li>
          חלקים מהאתר בנויים על גלילה שמניעה אנימציה. מי שמעדיף פחות תנועה מקבל גרסה סטטית מלאה, אבל
          היא פשוטה יותר מהחוויה המלאה.
        </li>
        <li>
          גלריית העבודות במחשב נשלטת גם בגרירה. יש לה גם חיצים ונקודות שאפשר להגיע אליהם במקלדת, אבל
          חוויית הגרירה עצמה אינה זמינה בלי עכבר או מגע.
        </li>
        <li>האתר לא נבדק מול כל צירופי תוכנות ההקראה והדפדפנים הקיימים.</li>
      </ul>

      <h2>פניות בנושא נגישות</h2>
      <p>
        אחראי הנגישות הוא עומר, {SITE_NAME}. אם נתקלתם במשהו שלא עובד, קשה לשימוש או לא נגיש — אשמח
        לשמוע, ואטפל בזה.
      </p>
      <ul>
        <li>
          דוא״ל: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
        <li>
          וואטסאפ:{" "}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
            055-275-9445
          </a>
        </li>
      </ul>
      <p>אשתדל לחזור לכל פנייה בנושא נגישות בתוך שלושה ימי עסקים.</p>

      <p>
        ראו גם: <Link href="/privacy">מדיניות פרטיות</Link> ו<Link href="/terms">תנאי שימוש</Link>.
      </p>
    </LegalPage>
  );
}
