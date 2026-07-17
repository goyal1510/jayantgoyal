import type { SerializablePortfolioData } from "@/lib/portfolio/serializable";

export type SectionId = SerializablePortfolioData["NAV_ITEMS"][number]["id"];
export type Project = SerializablePortfolioData["PROJECTS"][number];
export type Certificate = SerializablePortfolioData["CERTIFICATES"][number];

export const sectionId = (id: SectionId) => id;
export const sectionScrollMargin = "scroll-mt-20";
