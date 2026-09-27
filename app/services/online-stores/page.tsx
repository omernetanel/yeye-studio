import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import OnlineStoresContent from "./OnlineStoresContent";

export const metadata: Metadata = {
  title: pageTitle("חנויות אונליין"),
  description: "חנות אונליין שמוכרת גם כשאתם ישנים: מעוצבת, מהירה ומאובטחת.",
  alternates: { canonical: "/services/online-stores" },
};

export default function OnlineStoresPage() {
  return <OnlineStoresContent />;
}
