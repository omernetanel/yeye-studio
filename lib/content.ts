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

// The three things a client needs to believe before hiring one person instead
// of a studio. Not achievements and not numbers: each one is a plain fact about
// how the work is arranged, which an agency that subcontracts or assembles
// templates could not honestly write — where "Design-First" and a project count
// are things anyone can claim and nobody can check.
export const aboutFacts = [
  {
    title: "אתם עובדים איתי.",
    description:
      "אין מנהל פרויקט או אנשים באמצע. התקשורת, החשיבה והעבודה הן ישירות מולי.",
  },
  {
    title: "אני מעצב וגם בונה.",
    description:
      "אני מלווה את הפרויקט מהרעיון והחוויה ועד הפיתוח והמוצר שעולה בפועל לאוויר.",
  },
  {
    title: "שום דבר לא מגיע מתבנית.",
    description:
      "כל פרויקט מתחיל מהעסק, מהמטרה ומהבעיה שצריך לפתור — ורק משם מגיעים לעיצוב.",
  },
];
