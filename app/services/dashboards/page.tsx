import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import DashboardsContent from "./DashboardsContent";

export const metadata: Metadata = {
  title: pageTitle("מערכות ניהול"),
  description: "דשבורד וכלי ניהול פנימיים שמסדרים את העסק במקום אחד, בממשק פשוט, בלי גיליונות אקסל.",
};

export default function DashboardsPage() {
  return <DashboardsContent />;
}
