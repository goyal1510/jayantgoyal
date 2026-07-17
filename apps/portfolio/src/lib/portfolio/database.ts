export {
  getHero,
  getAbout,
  getEducation,
  getExperience,
  getSkillCategories,
  getSkills,
  getSkillCategoriesWithSkills,
  getTechIcons,
  getProjects,
  getCertificates,
  getContact,
  getNavItems,
  getFullPortfolioData,
} from "./queries";

export { transformPortfolioData } from "./transforms";

import { getFullPortfolioData } from "./queries";
import { transformPortfolioData } from "./transforms";
import type { TransformedPortfolioData } from "./database.types";

export async function getTransformedPortfolioData(): Promise<TransformedPortfolioData> {
  const rawData = await getFullPortfolioData();
  return transformPortfolioData(rawData);
}
