/**
 * The four stages of the work: what they are called, and what is said of them.
 * Their drawings are in ./art.tsx.
 *
 * They live here rather than beside the desktop diagram because the phone draws
 * the same four stages on the same open sheet, in a vertical arrangement that
 * shares nothing else with the desktop's layout. The words are what both do
 * share, and a second copy of either is the kind of duplicate that
 * quietly drifts apart — which it already had: the phone's first stage read
 * "מכירים את העסק" against the desktop's "מבינים את העסק", and the heading over
 * it was the English word "process" against "איך אני עובד?". Two files, two
 * answers to the same question. Now there is one.
 *
 * What is NOT here is anything about arrangement: coordinates and sizes belong
 * to whichever layout is doing the drawing. The sentence under each title is
 * here, because both layouts print it.
 */
/**
 * The heading over the diagram, as the two lines it breaks into. The break is
 * deliberate on the desktop, where the heading sits in the corner of the sheet
 * in a column two words wide; the phone joins them back into one line. Kept as
 * lines rather than as a string with a `<br/>` in it so neither layout has to
 * parse the other's markup.
 */
export const PROCESS_HEADING = ["איך אני", "עובד?"];

/** In order. The numeral each one carries is its position, not a field. */
export const STAGE_TITLES = [
  "מבינים את העסק",
  "מעצבים את החוויה",
  "בונים את זה נכון",
  "עולים לאוויר",
];

/**
 * The sentence under each title, as the two lines the desktop sets it in. That
 * drawing is SVG, which does not wrap, so its breaks are chosen by hand; the
 * phone joins the pair and lets the browser wrap to its own width.
 */
export const STAGE_LINES = [
  ["לפני הכול יושבים ומדברים: מה המטרה, מי הקהל,", "ומה כבר לא עובד. אתר טוב מתחיל בהבנה."],
  ["כל מסך, כל מרווח וכל צבע נבחרים בכוונה,", "כדי שהגולש ידע בדיוק לאן ללכת."],
  ["קוד נקי ומהיר שבנוי להחזיק שנים, בלי הפתעות", "כשתרצו לשנות או להוסיף משהו."],
  ["ביום ההשקה אני שם, וגם הרבה אחריו.", "ממשיכים לתקן, לשפר ולגדול יחד."],
];
