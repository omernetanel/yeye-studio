import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME, WHATSAPP_NUMBER, pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("מדיניות פרטיות"),
  description: "איזה מידע נאסף באתר YEYE Digital, לאן הוא מגיע, כמה זמן הוא נשמר ואיך מבקשים למחוק אותו.",
  alternates: { canonical: "/privacy" },
};

/**
 * WRITTEN FROM THE CODE, not from a template.
 *
 * Every claim here was checked against what the site actually does: the two
 * forms and the fields they carry, the route that sends them, the one service
 * that receives them, the absence of any cookie or analytics, and the single
 * key in the browser's own storage. Nothing is described that does not exist,
 * and nothing that exists is left out.
 *
 * What is NOT here, because it is not mine to invent: a company number, a
 * postal address, and any promise about how a third party keeps data. Those
 * come from the owner, and this page has to be read by a lawyer before launch.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="מדיניות פרטיות" updated="27 בספטמבר 2026">
      <p>
        העמוד הזה מסביר איזה מידע נאסף באתר של {SITE_NAME}, מה נעשה איתו, כמה זמן הוא נשמר ואיך אפשר
        לבקש לעיין בו או למחוק אותו. הוא כתוב בשפה פשוטה ומתאר את מה שהאתר עושה בפועל.
      </p>

      <h2>מי אחראי על המידע</h2>
      <p>
        {SITE_NAME}, סטודיו דיגיטלי בבעלות עומר. לכל פנייה בנושא פרטיות:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> או{" "}
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
          וואטסאפ
        </a>
        .
      </p>

      <h2>איזה מידע נאסף</h2>
      <p>
        באתר שני טפסי יצירת קשר, ושניהם אוספים את אותם שדות: <strong>שם מלא</strong>,{" "}
        <strong>כתובת דוא״ל</strong> ו<strong>מספר טלפון</strong>, כשהטלפון אינו חובה. אין באתר שום
        שדה נוסף, ואין איסוף של מידע שלא הקלדתם בעצמכם.
      </p>
      <p>
        אם אתם פונים אליי בוואטסאפ או במייל במקום דרך הטופס, השיחה עצמה והפרטים שבה נשמרים אצלי
        באותו אופן. את שירות הוואטסאפ מפעילה החברה שמאחוריו ולא אני.
      </p>

      <h2>לאן המידע מגיע</h2>
      <p>
        פנייה מהטופס נשלחת מהשרת של האתר אל שירות דיוור בשם EmailJS, שמעביר אותה לתיבת הדואר שלי.
        המידע לא נשמר במסד נתונים של האתר, לא מועבר למערכת ניהול לקוחות, ולא נמכר או מושכר לאף אחד.
      </p>
      <p>
        האתר מתארח בשירות Vercel. כמו כל שרת באינטרנט, הוא רושם נתוני גישה טכניים כדי להגיש את
        העמודים ולאבטח אותם.
      </p>

      <h2>כמה זמן המידע נשמר</h2>
      <p>
        פניות נשמרות בתיבת הדואר ובוואטסאפ ללא מגבלת זמן, כדי שאוכל לחזור אליכם ולהמשיך שיחה שהתחלנו,
        עד שתבקשו למחוק אותן.
      </p>

      <h2>הזכויות שלכם</h2>
      <p>
        אתם יכולים לבקש בכל רגע לדעת איזה מידע שמור עליכם, לתקן אותו, או למחוק אותו לחלוטין. פנייה
        לאחת מדרכי הקשר למעלה מספיקה, ואין צורך לנמק. מחיקה כוללת את הפנייה בתיבת הדואר ואת השיחה
        בוואטסאפ.
      </p>

      <h2>קובצי עוגייה ומעקב</h2>
      <p>
        באתר <strong>אין קובצי עוגייה</strong>, אין כלי מדידה, אין פיקסלים של רשתות חברתיות ואין שום
        כלי שמעביר מידע עליכם לגורם שלישי. מסיבה זו גם אין באתר חלון בקשת הסכמה.
      </p>
      <p>
        הדבר היחיד שנשמר בדפדפן שלכם הוא הבחירה שלכם בהגדרות הנגישות - ניגודיות, תנועה והדגשת
        קישורים. השמירה הזו נשארת במכשיר שלכם, לא נשלחת לשום מקום, ואפשר למחוק אותה בכל רגע מהגדרות
        הדפדפן.
      </p>

      <h2>אבטחה</h2>
      <p>
        האתר מוגש בחיבור מוצפן, ונתוני הטופס עוברים דרך השרת שלו ולא ישירות מהדפדפן לשירות חיצוני.
        עם זאת, שום העברה באינטרנט אינה חסינה לחלוטין, ואני לא יכול להבטיח אבטחה מוחלטת.
      </p>

      <h2>קישורים לאתרים אחרים</h2>
      <p>
        בעמודי העבודות מוצגים אתרים של לקוחות, ולעיתים אפשר לפתוח אותם. למדיניות הפרטיות של אתרים
        אלה אין קשר לזו שכאן.
      </p>

      <h2>שינויים במדיניות</h2>
      <p>
        אם האתר יתחיל לאסוף מידע נוסף או להשתמש בכלי מדידה, העמוד הזה יעודכן והתאריך שלמעלה ישתנה.
      </p>

      <p>
        ראו גם: <Link href="/terms">תנאי שימוש</Link> ו<Link href="/accessibility">הצהרת נגישות</Link>.
      </p>
    </LegalPage>
  );
}
