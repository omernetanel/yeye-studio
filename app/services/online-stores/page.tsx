import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import OnlineStoresContent from "./OnlineStoresContent";

export const metadata: Metadata = {
  title: pageTitle("חנויות אונליין"),
  description: "חנות אונליין שמוכרת, גם כשאתה ישן. חנות מעוצבת, מהירה ומאובטחת שמביאה מכירות.",
};

export default function OnlineStoresPage() {
  return <OnlineStoresContent />;
}
