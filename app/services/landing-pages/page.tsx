import type { Metadata } from "next";
import LandingPagesContent from "./LandingPagesContent";

export const metadata: Metadata = {
  title: "דפי נחיתה | YEYE LABS",
  description: "דפי נחיתה שממירים, לא רק נראים טוב. כל דף נבנה למטרה אחת: להפוך מבקרים ללקוחות.",
};

export default function LandingPagesPage() {
  return <LandingPagesContent />;
}
