import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import BrandingContent from "./BrandingContent";

export const metadata: Metadata = {
  title: pageTitle("מיתוג עסקי"),
  description: "זהות חזותית מלאה שמבדלת אתכם מהמתחרים: לוגו, מדריך מותג ועיצוב אחיד בכל מקום.",
};

export default function BrandingPage() {
  return <BrandingContent />;
}
