import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME, WHATSAPP_NUMBER, pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("מדיניות פרטיות"),
  description: "איזה מידע נאסף באתר YEYE Digital, מי מעבד אותו, כמה זמן הוא עשוי להישמר ואילו זכויות עומדות לכם.",
  alternates: { canonical: "/privacy" },
};

/**
 * WRITTEN FROM THE CODE, claim by claim.
 *
 * Everything here was checked against what the site actually does: the two
 * forms and the fields they send (name, email, optional phone, and an optional
 * free-text box in the closing form only), the fixed label naming which form
 * it came from, the automatic receipt mailed to the address given, the
 * honeypot, the IP read for rate limiting, the one route
 * that sends the enquiry, the services that carry it (Resend sends it,
 * ImprovMX forwards the domain's mail to a Gmail inbox, Vercel hosts), and the
 * two keys in the browser's own storage (accessibility choices in
 * localStorage, the in-site trail behind "חזור" in sessionStorage).
 *
 * WHAT IS DELIBERATELY NOT HERE:
 * - No claim about how long any of those services keeps anything. That cannot
 *   be known from this codebase, so the page says only that they process it.
 * - No declaration that the site has no cookies, no analytics and no need for
 *   a consent mechanism. A measurement tool is planned before launch; this page
 *   describes what exists now and is updated when that lands, rather than
 *   stating an absence that is about to stop being true.
 * - No statement about database registration, notification or a privacy
 *   officer. That is a business and legal question, not a code one.
 * - No absolute promises: no "never", no "completely", no "will be erased".
 *
 * The deletion paragraph is the one to leave alone. It deliberately does not
 * promise that every request is honoured, and the grounds listed for keeping
 * information were chosen by the owner.
 *
 * This page has to be read by a lawyer before launch.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="מדיניות פרטיות" updated="29 בספטמבר 2026">
      <p>
        העמוד הזה מסביר איזה מידע נאסף באתר של {SITE_NAME}, מה נעשה איתו, מי מעבד אותו, כמה זמן הוא
        עשוי להישמר ואילו זכויות עומדות לכם.
      </p>

      <h2>מי מפעיל את האתר</h2>
      <p>
        האתר מופעל על ידי עומר, עוסק עצמאי הפועל תחת המותג {SITE_NAME}. לכל פנייה בנושא פרטיות,
        לרבות בקשת עיון או תיקון: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> או{" "}
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
          וואטסאפ
        </a>
        .
      </p>

      <h2>איזה מידע נאסף</h2>
      <p>
        באתר שני טפסי יצירת קשר. שניהם אוספים שם מלא וכתובת דוא״ל כשדות חובה, ומספר טלפון שמסירתו
        אינה חובה. בטופס שבסוף העמוד יש גם תיבה חופשית, שמילויה אינו חובה, שבה אפשר לספר על מה
        שאתם צריכים. יחד עם הפרטים נשלח ציון של הטופס שממנו הגיעה הפנייה.
      </p>
      <p>
        בשני הטפסים קיים גם שדה נסתר שנועד לזהות שליחה אוטומטית של תוכנות ספאם. הוא אינו מיועד למילוי,
        ופנייה שהגיעה כשהוא מלא נדחית ואינה נשלחת.
      </p>
      <p>
        כתובת ה־IP משמשת באופן זמני גם לצורך הגבלת מספר הפניות ומניעת שימוש לרעה בטופס, ואינה נשמרת
        לצורך זה במסד נתונים קבוע.
      </p>
      <p>
        אם אתם פונים אליי בוואטסאפ או בדוא״ל במקום דרך הטופס, הפרטים שבפנייה ותוכן השיחה נשמרים
        אצלי באותו אופן. את שירות הוואטסאפ מפעילה החברה שמאחוריו ולא אני, והשימוש בו כפוף למדיניות
        שלה.
      </p>
      <p>
        כמו בכל אתר באינטרנט, ספק האירוח שמגיש את העמודים מעבד נתוני גישה טכניים, כגון כתובת IP
        ופרטי דפדפן, הדרושים להגשת האתר, לתפעולו ולאבטחתו.
      </p>

      <h2>למה המידע משמש</h2>
      <p>
        לחזור אליכם ולענות לפנייה, להמשיך התקשרות עסקית אם היא נוצרת, לתעד את ההתקשרות, ולהגן על
        האתר מפני שימוש לרעה. פרטי הפנייה אינם משמשים לדיוור פרסומי ואינם נמכרים או מושכרים.
      </p>
      <p>
        לאחר שליחת הטופס נשלח לכתובת הדוא״ל שהוזנה מייל אישור אוטומטי על קבלת הפנייה.
      </p>

      <h2>מי מעבד את המידע</h2>
      <p>
        פנייה מהטופס נשלחת מהשרת של האתר באמצעות שירות שליחת דואר בשם Resend, אל כתובת הדוא״ל של
        העסק בדומיין של האתר. דואר שמגיע לכתובות בדומיין הזה, כולל פניות מהטופס ומיילים שנשלחים
        אליי ישירות, מועבר באמצעות שירות העברת דואר בשם ImprovMX לתיבת הדואר שלי, המתנהלת בשירות
        Gmail של Google. תשובות שאני שולח בדוא״ל יוצאות גם הן דרך Resend. כל אחד מהשירותים האלה
        מעבד את המידע עבורי לצורך זה, והשימוש בהם כפוף לתנאים ולמדיניות שלהם. האתר מתארח בשירות
        Vercel, שעשוי לעבד נתוני גישה טכניים כמתואר למעלה.
      </p>
      <p>
        מעבר לכך, פרטי הפנייה אינם נמסרים לגורמים נוספים, למעט כאשר הדבר נדרש לפי דין או לצורך הגנה
        ומימוש של זכויות משפטיות.
      </p>

      <h2>מסירת הפרטים היא מרצון</h2>
      <p>
        אין חובה חוקית למסור את הפרטים, ואתם בוחרים אם למלא את הטופס. ללא שם וכתובת דוא״ל לא אוכל
        לחזור אליכם. מסירת הטלפון אינה נדרשת, והיא רק מאפשרת ליצור קשר טלפוני אם תעדיפו זאת. גם
        התיבה החופשית אינה נדרשת.
      </p>

      <h2>אחסון בדפדפן</h2>
      <p>
        האתר שומר בדפדפן שלכם שני דברים. הראשון הוא בחירתכם בהגדרות הנגישות: ניגודיות, תנועה והדגשת
        קישורים. השמירה נעשית באחסון המקומי של הדפדפן, ואפשר למחוק אותה בכל רגע מהגדרות הדפדפן.
      </p>
      <p>
        השני הוא רשימת העמודים באתר שבהם ביקרתם בחלון הנוכחי, כדי שכפתור &quot;חזור&quot; יחזיר אתכם
        לעמוד הקודם באתר. היא נשמרת באחסון של החלון בלבד ונמחקת כשסוגרים אותו.
      </p>
      <p>שני אלה נשארים במכשיר שלכם ואינם נשלחים אליי.</p>

      <h2>תצוגה חיה של אתרי לקוחות</h2>
      <p>
        בעמודי העבודות אפשר לצפות באתרי לקוחות בתוך העמוד. התצוגה נטענת רק לאחר לחיצה מפורשת שלכם.
        מרגע שנטענה אתם גולשים באתר של הלקוח, והוא עשוי לקבל נתוני רשת ודפדפן ולהשתמש בעוגיות או
        בטכנולוגיות משלו, בהתאם למדיניות שלו. אין לי שליטה על האופן שבו אותם אתרים מעבדים מידע.
        אותו דבר נכון לכל קישור יוצא מהאתר.
      </p>

      <h2>כמה זמן המידע נשמר</h2>
      <p>
        המידע נשמר למשך הזמן הדרוש לטיפול בפנייה, להמשך התקשרות עסקית, לניהול העסק, לעמידה בדרישות
        הדין ולהגנה או מימוש של זכויות משפטיות, לפי העניין.
      </p>

      <h2>הזכויות שלכם</h2>
      <p>
        לפי חוק הגנת הפרטיות עומדת לכם זכות לעיין במידע אישי על אודותיכם המוחזק במאגר, ולבקש את
        תיקונו אם הוא אינו נכון, שלם, ברור או מעודכן.
      </p>
      <p>
        ניתן גם לפנות בבקשה למחיקת מידע. ייתכנו מקרים שבהם מידע יישמר גם לאחר בקשה כאמור, כאשר
        קיימת לכך הצדקה לגיטימית בהתאם לדין, למשל לצורך תיעוד התקשרות עסקית, טיפול במחלוקת, מניעת
        שימוש לרעה, התגוננות מפני טענות או תביעות, או הגנה ומימוש של זכויות משפטיות.
      </p>
      <p>לכל בקשה אפשר לפנות בדרכי הקשר שלמעלה.</p>

      <h2>אבטחת מידע</h2>
      <p>
        האתר מוגש בחיבור מוצפן, ופניות מהטופס עוברות דרך השרת של האתר ולא ישירות מהדפדפן אל שירות
        חיצוני. ננקטים אמצעים סבירים להגנה על המידע, אך שום העברה או אחסון באינטרנט אינם חסינים
        במלואם, ולא ניתן להבטיח אבטחה מוחלטת.
      </p>

      <h2>שינויים במדיניות</h2>
      <p>
        אם האתר יתחיל לאסוף מידע נוסף, להשתמש בכלי מדידה או להעביר מידע לגורם נוסף, העמוד הזה
        יעודכן והתאריך שלמעלה ישתנה.
      </p>

      <p>
        ראו גם: <Link href="/terms">תנאי שימוש</Link> ו<Link href="/accessibility">הצהרת נגישות</Link>.
      </p>
    </LegalPage>
  );
}
