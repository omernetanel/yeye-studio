import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { ServiceStructuredData } from "@/components/seo/StructuredData";
import DashboardsContent from "./DashboardsContent";

const NAME = "פיתוח מערכות ניהול לעסקים";
const DESCRIPTION =
  "פיתוח מערכת ניהול ודשבורד בהתאמה אישית, שמרכזים את העסק במקום אחד, בממשק פשוט ובלי גיליונות אקסל.";
const PATH = "/services/dashboards";

export const metadata: Metadata = pageMetadata({ label: NAME, description: DESCRIPTION, path: PATH });

export default function DashboardsPage() {
  return (
    <>
      <ServiceStructuredData name={NAME} description={DESCRIPTION} path={PATH} />
      <DashboardsContent />
    </>
  );
}
