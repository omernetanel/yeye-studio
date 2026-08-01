import type { Metadata } from "next";
import BrandingContent from "./BrandingContent";

export const metadata: Metadata = {
  title: "מיתוג עסקי | YEYE LABS",
  description: "זהות חזותית מלאה שמבדלת אותך מהמתחרים: לוגו, מדריך מותג ועיצוב עקבי בכל נקודת מגע.",
};

export default function BrandingPage() {
  return <BrandingContent />;
}
