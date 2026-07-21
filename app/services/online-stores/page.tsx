import type { Metadata } from "next";
import OnlineStoresContent from "./OnlineStoresContent";

export const metadata: Metadata = {
  title: "חנויות אונליין | YEYE LABS",
  description: "חנות אונליין שמוכרת, גם כשאתה ישן. חנות מעוצבת, מהירה ומאובטחת שמביאה מכירות.",
};

export default function OnlineStoresPage() {
  return <OnlineStoresContent />;
}
