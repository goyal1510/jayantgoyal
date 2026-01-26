import type { Metadata } from "next"
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Home | Jayant Goyal",
  description: "Welcome to Jayant Goyal's personal website.",
}

export default function RootPage() {
  redirect("/portfolio");
}
