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
 * forms and the fields they send, the message the browser builds around the
 * phone number, the honeypot, the IP read for rate limiting, the one route
 * that sends the enquiry, the two services that touch it, and the single key
 * in the browser's own storage.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 * - No claim about how long EmailJS keeps anything. That cannot be known from
 *   this codebase, so the page says only that it processes the enquiry.
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
    <LegalPage title="מדיניות פרטיות" updated="27 בספטמבר 2026">
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
        באתר שני טפסי יצירת קשר, ושניהם אוספים את אותם הפרטים: שם מלא וכתובת דוא״ל כשדות חובה,
        ומספר טלפון שמסירתו אינה חובה. יחד עם הפרטים נשלחת שורת זיהוי קצרה שמציינת מאיזה טופס באתר
        הגיעה הפנייה, וכן הטלפון אם מילאתם אותו.
      </p>
      <p>
        בטופס קיים גם שדה נסתר שנועד לזהות שליחה אוטומטית של תוכנות ספאם. הוא אינו מיועד למילוי,
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

      <h2>מי מעבד את המידע</h2>
      <p>
        פנייה מהטופס נשלחת מהשרת של האתר אל שירות דיוור בשם EmailJS, שמעביר אותה לתיבת הדואר שלי.
        EmailJS מעבד את הפנייה עבורי לצורך זה, והשימוש בשירות כפוף לתנאים ולמדיניות שלו. האתר
        מתארח בשירות Vercel, שעשוי לעבד נתוני גישה טכניים כמתואר למעלה.
      </p>
      <p>
        מעבר לכך, פרטי הפנייה אינם נמסרים לגורמים נוספים, למעט כאשר הדבר נדרש לפי דין או לצורך הגנה
        ומימוש של זכויות משפטיות.
      </p>

      <h2>מסירת הפרטים היא מרצון</h2>
      <p>
        אין חובה חוקית למסור את הפרטים, ואתם בוחרים אם למלא את הטופס. ללא שם וכתובת דוא״ל לא אוכל
        לחזור אליכם. מסירת הטלפון אינה נדרשת, והיא רק מאפשרת ליצור קשר טלפוני אם תעדיפו זאת.
      </p>

      <h2>אחסון בדפדפן</h2>
      <p>
        האתר שומר בדפדפן שלכם את בחירתכם בהגדרות הנגישות: ניגודיות, תנועה והדגשת קישורים. השמירה
        נעשית באחסון המקומי של הדפדפן, נשארת במכשיר שלכם, ואפשר למחוק אותה בכל רגע מהגדרות הדפדפן.
      </p>

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
