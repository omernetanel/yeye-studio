import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import LandingPagesContent from "./LandingPagesContent";

export const metadata: Metadata = {
  title: pageTitle("דפי נחיתה"),
  description: "דפי נחיתה שממירים, לא רק נראים טוב. כל דף נבנה למטרה אחת: להפוך מבקרים ללקוחות.",
};

export default function LandingPagesPage() {
  return <LandingPagesContent />;
}
