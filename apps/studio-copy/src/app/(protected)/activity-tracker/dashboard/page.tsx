import type { Metadata } from "next";
import DashboardClient from "./client";

export const metadata: Metadata = {
  title: "Activity Tracker Dashboard",
  description:
    "Track and visualize your daily activities with charts and analytics.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
