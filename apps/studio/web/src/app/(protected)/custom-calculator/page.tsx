import type { Metadata } from "next";
import CustomCalculatorClient from "./client";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Calculator Builder",
  description:
    "Build your own drag-and-drop calculator with custom formulas and fields.",
  pathname: "/custom-calculator",
});

export default function Page() {
  return <CustomCalculatorClient />;
}
