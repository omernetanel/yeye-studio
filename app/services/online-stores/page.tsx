import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { ServiceStructuredData } from "@/components/seo/StructuredData";
import OnlineStoresContent from "./OnlineStoresContent";

const NAME = "בניית חנות אונליין";
const DESCRIPTION =
  "הקמת חנות אינטרנטית שמוכרת גם כשאתם ישנים: חנות אונליין מעוצבת מאפס, מהירה ומאובטחת.";
const PATH = "/services/online-stores";

export const metadata: Metadata = pageMetadata({ label: NAME, description: DESCRIPTION, path: PATH });

export default function OnlineStoresPage() {
  return (
    <>
      <ServiceStructuredData name={NAME} description={DESCRIPTION} path={PATH} />
      <OnlineStoresContent />
    </>
  );
}
