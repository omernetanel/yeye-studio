import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import LandingPagesContent from "./LandingPagesContent";

export const metadata: Metadata = {
  title: pageTitle("דפי נחיתה"),
  description: "דפי נחיתה שנבנים בשביל מטרה אחת: להפוך גולשים ללקוחות.",
  alternates: { canonical: "/services/landing-pages" },
};

export default function LandingPagesPage() {
  return <LandingPagesContent />;
}
