import type { Metadata } from "next";
import BusinessSitesContent from "./BusinessSitesContent";

export const metadata: Metadata = {
  title: "אתרי תדמית | YEYE LABS",
  description: "אתר תדמית שגורם ללקוחות לסמוך עליך — עיצוב שמייצג אותך, בנוי לצמוח, ובנוי להמיר.",
};

export default function BusinessSitesPage() {
  return <BusinessSitesContent />;
}
