/**
 * Copy that more than one version of a section renders.
 *
 * The mobile page is a separate design rather than the desktop one reflowed,
 * so both trees show the same four services and the same three facts in
 * layouts that have nothing else in common. Keeping the words here means a
 * wording change lands in both at once instead of drifting apart the first
 * time only one of them gets edited.
 *
 * Prose with inline emphasis stays in the components — marking it up as data
 * would cost more than the duplication it saves.
 */

export const services = [
  {
    title: "חנויות אונליין",
    description: "חנויות מעוצבות ומדויקות\nעם חוויית קנייה שמביאה מכירות.",
    href: "/services/online-stores",
  },
  {
    title: "דפי נחיתה ואתרי תדמית",
    description: "דפים ואתרים ממוקדים שממירים\nגולשים ללקוחות ובונים אמון.",
    href: "/services/landing-pages",
  },
  {
    title: "מערכות ניהול",
    description: "דשבורדים וכלי ניהול פנימיים\nשמסדרים את העסק שלך במקום אחד.",
    href: "/services/dashboards",
  },
  {
    title: "מיתוג עסקי",
    description: "זהות חזותית מלאה שמבדלת אותך\nמהמתחרים ובונה מותג שנשאר בזיכרון.",
    href: "/services/branding",
  },
];

// What is actually true about how the work gets done. No counts and no client
// logos on purpose: with a young practice those numbers are small, and putting
// a small number in large type advertises the gap rather than closing it. These
// three claims cost nothing to state and are worth more, because a studio that
// hands work to juniors or starts from a template cannot state them at all.
export const aboutFacts = [
  {
    title: "איש אחד, מקצה לקצה",
    description: "העיצוב והפיתוח באותן ידיים, כך ששום כוונה לא הולכת לאיבוד בדרך.",
  },
  {
    title: "הכל נבנה מאפס",
    description: "בלי תבניות ובלי תוספים. כל פרויקט נבנה בדיוק למה שהוא צריך לעשות.",
  },
  {
    title: "מדברים ישירות איתי",
    description: "בלי מנהל פרויקט באמצע, בלי מתווך, ובלי לחכות בתור.",
  },
];
