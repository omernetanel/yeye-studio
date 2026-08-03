import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import BusinessSitesContent from "./BusinessSitesContent";

export const metadata: Metadata = {
  title: pageTitle("אתרי תדמית"),
  description: "אתר תדמית שגורם ללקוחות לסמוך עליך: עיצוב שמייצג אותך, בנוי לצמוח, ובנוי להמיר.",
};

export default function BusinessSitesPage() {
  return <BusinessSitesContent />;
}
