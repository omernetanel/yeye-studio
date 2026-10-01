import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { ServiceStructuredData } from "@/components/seo/StructuredData";
import BrandingContent from "./BrandingContent";

const NAME = "מיתוג עסקי ועיצוב לוגו";
const DESCRIPTION =
  "מיתוג לעסקים: זהות חזותית מלאה שמבדלת אתכם מהמתחרים. לוגו, מדריך מותג ועיצוב אחיד בכל מקום.";
const PATH = "/services/branding";

export const metadata: Metadata = pageMetadata({ label: NAME, description: DESCRIPTION, path: PATH });

export default function BrandingPage() {
  return (
    <>
      <ServiceStructuredData name={NAME} description={DESCRIPTION} path={PATH} />
      <BrandingContent />
    </>
  );
}
