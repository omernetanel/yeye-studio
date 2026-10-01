import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { ServiceStructuredData } from "@/components/seo/StructuredData";
import LandingPagesContent from "./LandingPagesContent";

const NAME = "בניית דפי נחיתה לעסקים";
const DESCRIPTION =
  "עיצוב ובניית דף נחיתה שנבנה בשביל מטרה אחת: להפוך גולשים ללקוחות. ממוקד, מהיר ומעוצב מאפס.";
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
