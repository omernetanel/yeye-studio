import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import BusinessSitesContent from "./BusinessSitesContent";

export const metadata: Metadata = {
  title: pageTitle("אתרי תדמית"),
  description: "אתר תדמית שגורם ללקוחות לסמוך עליכם: עיצוב שמייצג אתכם ואתר שבנוי לגדול עם העסק.",
};

export default function BusinessSitesPage() {
  return <BusinessSitesContent />;
}
