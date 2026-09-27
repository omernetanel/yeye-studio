import type { Metadata } from "next";
import { pageTitle } from "@/lib/site";
import DashboardsContent from "./DashboardsContent";

export const metadata: Metadata = {
  title: pageTitle("מערכות ניהול"),
  description: "דשבורד וכלי ניהול פנימיים שמרכזים את העסק במקום אחד, בממשק פשוט ובלי גיליונות אקסל.",
  alternates: { canonical: "/services/dashboards" },
};

export default function DashboardsPage() {
  return <DashboardsContent />;
}
