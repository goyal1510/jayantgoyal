import type { Metadata } from "next"
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Home | Jayant",
  description: "Welcome to Jayant's personal website.",
}

export default function RootPage() {
  redirect("/portfolio");
}
