import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { ServiceStructuredData } from "@/components/seo/StructuredData";
import BusinessSitesContent from "./BusinessSitesContent";

const NAME = "בניית אתר תדמית לעסקים";
const DESCRIPTION =
  "עיצוב ובניית אתר תדמית שגורם ללקוחות לסמוך עליכם: עיצוב מאפס שמייצג אתכם, ואתר שבנוי לגדול עם העסק.";
const PATH = "/services/business-sites";

export const metadata: Metadata = pageMetadata({ label: NAME, description: DESCRIPTION, path: PATH });

export default function BusinessSitesPage() {
  return (
    <>
      <ServiceStructuredData name={NAME} description={DESCRIPTION} path={PATH} />
      <BusinessSitesContent />
    </>
  );
}
