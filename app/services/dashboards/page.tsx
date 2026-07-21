import type { Metadata } from "next";
import DashboardsContent from "./DashboardsContent";

export const metadata: Metadata = {
  title: "מערכות ניהול | YEYE LABS",
  description: "דשבורד וכלי ניהול פנימיים שמסדרים את העסק במקום אחד, בממשק פשוט, בלי גיליונות אקסל.",
};

export default function DashboardsPage() {
  return <DashboardsContent />;
}
