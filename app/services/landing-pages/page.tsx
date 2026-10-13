import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { ServiceStructuredData } from "@/components/seo/StructuredData";
import LandingPagesContent from "./LandingPagesContent";

const NAME = "בניית דפי נחיתה ואתרי תדמית";
const DESCRIPTION =
  "עיצוב ובניית דפי נחיתה ואתרי תדמית לעסקים: דף שנבנה בשביל מטרה אחת, או אתר שמציג את העסק כולו. מהיר ומעוצב מאפס.";
const PATH = "/services/landing-pages";

export const metadata: Metadata = pageMetadata({ label: NAME, description: DESCRIPTION, path: PATH });

export default function LandingPagesPage() {
  return (
    <>
      <ServiceStructuredData name={NAME} description={DESCRIPTION} path={PATH} />
      <LandingPagesContent />
    </>
  );
}
