import { PERSON_BRAND } from "@repo/brand";

export type ProjectTone = "paper" | "ink" | "signal";

export type PortfolioProfile = {
  name: string;
  displayName: string;
  monogram: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  headline: string;
  introduction: string;
  focus: string;
  currentRole: string;
  availability: string;
  github: string;
  linkedin: string;
  instagram: string;
  resume: string;
};

export type PortfolioAbout = {
  headline: string;
  objective: string;
  lead: string;
  story: string[];
  facts: Array<{ label: string; value: string }>;
  highlights: string[];
};

export type PortfolioEducation = {
  period: string;
  school: string;
  degree: string;
  location: string;
  detail: string;
};

export type PortfolioExperience = {
  period: string;
  company: string;
  role: string;
  location: string;
  summary: string;
  outcomes: string[];
};

export type SkillProficiency = "core" | "strong" | "working" | "exploring";

export type PortfolioSkill = {
  name: string;
  proficiency?: SkillProficiency;
  evidence?: string;
  isFeatured?: boolean;
};

export type PortfolioSkillGroup = {
  title: string;
  description: string;
  items: PortfolioSkill[];
};

export type PortfolioProject = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  impact: string;
  role: string;
  year: string;
  image: string;
  imageHeight: number;
  imageAlt: string;
  href: string;
  github: string;
  tags: string[];
  tone: ProjectTone;
};

export type PortfolioCredential = {
  name: string;
  issuer: string;
  category: string;
  href: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
};

export type PortfolioPrinciple = {
  title: string;
  copy: string;
};

export type PortfolioNavigationItem = {
  key: string;
  label: string;
  note: string;
};

export const PORTFOLIO_SECTION_KEYS = [
  "skills",
  "education",
  "experience",
  "credentials",
  "activity",
  "work",
  "writing",
  "contact",
] as const;

export type PortfolioSectionKey = (typeof PORTFOLIO_SECTION_KEYS)[number];

export type PortfolioSectionContent = {
  eyebrow: string;
  headline: string;
  accent: string;
  description: string;
  supportingText: string;
};

export type PortfolioSectionContentMap = Record<
  PortfolioSectionKey,
  PortfolioSectionContent
>;

export const portfolioProfile: PortfolioProfile = {
  name: PERSON_BRAND.fullName,
  displayName: PERSON_BRAND.givenName,
  monogram: PERSON_BRAND.monogram,
  email: "goyal151002@gmail.com",
  phone: "+91 94134 95328",
  location: "Hyderabad, India",
  role: "Full-stack product engineer",
  headline: "I turn ambitious product ideas into clear, dependable software.",
  introduction:
    "I'm Jayant Goyal, a full-stack product engineer who turns ambitious, messy ideas into reliable experiences.",
  focus: "Healthcare product systems",
  currentRole: "Product Associate Engineer",
  availability: "Open to thoughtful collaborations",
  github: "https://github.com/goyal1510",
  linkedin: "https://www.linkedin.com/in/jayant-29714220b/",
  instagram: "https://www.instagram.com/goyal_1510/",
  resume: "/documents/Jayant_Resume.pdf",
};

export const about: PortfolioAbout = {
  headline: "I like the whole problem, not only the screen.",
  objective:
    "I am a full-stack product engineer working across product thinking, interface craft, APIs, data, and delivery. I care about building useful systems that remain clear as they grow.",
  lead: "I care about the path from the first product question to the final interaction detail.",
  story: [
    "My work moves comfortably between Next.js interfaces, TypeScript application logic, Supabase backends, and the smaller interaction details that make software feel dependable.",
    "I enjoy ambiguous product problems: finding the real constraint, mapping the system, shipping an early version, and learning from how people actually use it.",
  ],
  facts: [
    { label: "Based in", value: "Hyderabad, India" },
    { label: "Experience", value: "1+ years" },
    { label: "Current role", value: "Product Associate Engineer" },
    { label: "Degree", value: "B.Tech, Computer Science" },
  ],
  highlights: [
    "Full-stack web development",
    "React and Next.js",
    "TypeScript and JavaScript",
    "REST API design",
    "PostgreSQL and Supabase",
    "UI/UX and interaction design",
  ],
};

export const education: PortfolioEducation[] = [
  {
    period: "2020—24",
    school: "Kalinga Institute of Industrial Technology",
    degree: "B.Tech, Computer Science & Engineering",
    location: "Bhubaneswar",
    detail: "CGPA 8.98 / 10",
  },
  {
    period: "2020",
    school: "Nosegay Public School",
    degree: "Senior Secondary (XII), CBSE",
    location: "Sri Ganganagar",
    detail: "83.20%",
  },
  {
    period: "2018",
    school: "A.S.M. Public School",
    degree: "Secondary (X), CBSE",
    location: "Sri Ganganagar",
    detail: "86.20%",
  },
];

export const experience: PortfolioExperience[] = [
  {
    period: "Mar 2025—Now",
    company: "Neuraoak Technologies",
    role: "Product Associate Engineer",
    location: "Hyderabad",
    summary:
      "Building healthcare revenue-cycle products with Next.js, TypeScript, and Supabase.",
    outcomes: [
      "Automated claims workflows, reducing manual effort by 40% and errors by 25%.",
      "Integrated realtime data and authentication while reducing backend load by 30%.",
    ],
  },
  {
    period: "Jul—Nov 2023",
    company: "HighRadius Technologies",
    role: "Software Development Intern",
    location: "Bhubaneswar",
    summary:
      "Designed REST APIs and improved enterprise application performance across Java services.",
    outcomes: [
      "Delivered 15+ APIs for frontend and third-party integrations.",
      "Improved response times by 30% using Java, SQL, Hibernate, Struts, and Spring.",
    ],
  },
  {
    period: "May—Jul 2023",
    company: "HighRadius Technologies",
    role: "Tech Summer Intern",
    location: "Bhubaneswar",
    summary:
      "Built a full-stack product from requirements and UX decisions through backend delivery.",
    outcomes: [
      "Owned the end-to-end build and integration of the product experience.",
      "Worked across requirements, interface design, application logic, and delivery.",
    ],
  },
  {
    period: "Sep 2022—Aug 2023",
    company: "Desire Foundation",
    role: "Public Relations Intern",
    location: "Bhubaneswar",
    summary:
      "Coordinated education-focused fieldwork and cross-functional community programs.",
    outcomes: [
      "Reached 50+ children and families through an education campaign.",
      "Distributed 100+ notebooks and supported internal program coordination.",
    ],
  },
];

export const skillGroups: PortfolioSkillGroup[] = [
  {
    title: "Frontend & Interaction",
    description:
      "Responsive interfaces, interaction systems, and accessible product experiences.",
    items: [
      { name: "React", proficiency: "core", isFeatured: true },
      { name: "Next.js", proficiency: "core", isFeatured: true },
      { name: "TypeScript", proficiency: "core", isFeatured: true },
      { name: "Tailwind CSS", proficiency: "core", isFeatured: true },
      { name: "Framer Motion", proficiency: "strong", isFeatured: true },
      { name: "Radix UI", proficiency: "working", isFeatured: true },
      { name: "JavaScript", proficiency: "strong", isFeatured: true },
      { name: "HTML", proficiency: "strong", isFeatured: true },
      { name: "CSS3", proficiency: "strong", isFeatured: true },
      { name: "Redux", proficiency: "working", isFeatured: false },
    ],
  },
  {
    title: "Backend & Data",
    description:
      "Application services, authentication, APIs, realtime data, storage, and relational systems.",
    items: [
      { name: "Supabase", proficiency: "core", isFeatured: true },
      { name: "PostgreSQL", proficiency: "strong", isFeatured: true },
      { name: "Node.js", proficiency: "strong", isFeatured: true },
      { name: "REST APIs", proficiency: "strong", isFeatured: true },
      { name: "Realtime systems", proficiency: "strong", isFeatured: true },
      { name: "Object storage", proficiency: "strong", isFeatured: true },
      { name: "JWT", proficiency: "strong", isFeatured: false },
    ],
  },
  {
    title: "Tooling & Delivery",
    description:
      "The workflows that keep a multi-application platform testable, deployable, and maintainable.",
    items: [
      { name: "Vercel", proficiency: "core", isFeatured: true },
      { name: "Git", proficiency: "strong", isFeatured: true },
      { name: "GitHub", proficiency: "strong", isFeatured: true },
      { name: "Turborepo", proficiency: "strong", isFeatured: true },
      { name: "pnpm", proficiency: "strong", isFeatured: true },
      { name: "Vitest", proficiency: "working", isFeatured: true },
    ],
  },
  {
    title: "Languages & Enterprise",
    description:
      "Languages and enterprise technologies used across product work and earlier engineering roles.",
    items: [
      { name: "TypeScript", proficiency: "core", isFeatured: true },
      { name: "JavaScript", proficiency: "strong", isFeatured: true },
      { name: "Java", proficiency: "strong", isFeatured: true },
      { name: "SQL", proficiency: "strong", isFeatured: true },
      { name: "Python", proficiency: "exploring", isFeatured: false },
    ],
  },
  {
    title: "Product Engineering",
    description:
      "Product discovery, interface decisions, state design, and the systems thinking behind delivery.",
    items: [
      { name: "Product discovery", proficiency: "strong", isFeatured: true },
      { name: "Design systems", proficiency: "strong", isFeatured: true },
      { name: "State design", proficiency: "strong", isFeatured: true },
      { name: "Product analytics", proficiency: "working", isFeatured: true },
    ],
  },
];

const studioRepository =
  "https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio";

export const projects: PortfolioProject[] = [
  {
    id: "tech-tools",
    title: "Tech Tools",
    eyebrow: "Developer utility collection",
    summary:
      "Generators, converters, parsers, validators, formatters, and code tools in one searchable workspace.",
    impact:
      "A broad utility catalog shaped into a consistent experience with categories, favorites, responsive navigation, and instant results.",
    role: "Product engineering · Design systems",
    year: "2025—26",
    image: "/images/studio-tools.png",
    imageHeight: 1678,
    imageAlt:
      "Tech Tools catalog showing the full-width developer utilities interface",
    href: "https://studio.jayantgoyal.com/tools",
    github: studioRepository,
    tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    tone: "paper",
  },
  {
    id: "sync-messenger",
    title: "Sync Messenger",
    eyebrow: "Realtime messaging",
    summary:
      "Private conversations with instant synchronization, authentication, and durable message history.",
    impact:
      "Supabase subscriptions keep conversations current across devices while a focused interface keeps the stream readable.",
    role: "Full-stack engineering · Realtime UX",
    year: "2025",
    image: "/images/messenger.png",
    imageHeight: 1674,
    imageAlt: "Sync Messenger full-width conversation interface",
    href: "https://studio.jayantgoyal.com/messenger",
    github: studioRepository,
    tags: ["Next.js", "TypeScript", "Supabase", "Realtime"],
    tone: "ink",
  },
  {
    id: "activity-tracker",
    title: "Activity Tracker",
    eyebrow: "Personal analytics",
    summary:
      "Daily activity tracking with custom habits, month navigation, completion rates, and useful performance context.",
    impact:
      "A private, authenticated record that turns repeated daily actions into a view of progress over time.",
    role: "Product design · Data experience",
    year: "2025",
    image: "/images/activity-tracker.png",
    imageHeight: 1674,
    imageAlt: "Activity Tracker full-width calendar and analytics interface",
    href: "https://studio.jayantgoyal.com/activity-tracker/dashboard",
    github: studioRepository,
    tags: ["Next.js", "TypeScript", "Supabase", "Analytics"],
    tone: "signal",
  },
  {
    id: "game-hub",
    title: "Game Hub",
    eyebrow: "Local and online play",
    summary:
      "A growing collection of interactive games with solo, local, computer, and realtime room-based modes.",
    impact:
      "Shared game foundations support Tic Tac Toe, Connect Four, Memory Match, Wordle, Chess, Ludo, Dare X, and more.",
    role: "Game systems · Interaction engineering",
    year: "2025—26",
    image: "/images/games.png",
    imageHeight: 1676,
    imageAlt: "Game Hub full-width catalog interface",
    href: "https://studio.jayantgoyal.com/games",
    github: studioRepository,
    tags: ["Next.js", "TypeScript", "Supabase", "Game logic"],
    tone: "paper",
  },
  {
    id: "file-manager",
    title: "File Manager",
    eyebrow: "Private cloud workspace",
    summary:
      "Hierarchical folders, uploads, previews, search, move and copy operations, and recoverable deletion.",
    impact:
      "A complete storage workflow backed by private Supabase buckets, row-level security, and user-scoped data.",
    role: "Full-stack engineering · Storage systems",
    year: "2025",
    image: "/images/file-manager.png",
    imageHeight: 1676,
    imageAlt: "File Manager full-width folders and files interface",
    href: "https://studio.jayantgoyal.com/files",
    github: studioRepository,
    tags: ["Next.js", "Supabase Storage", "PostgreSQL", "RLS"],
    tone: "ink",
  },
  {
    id: "currency-calculator",
    title: "Currency Calculator",
    eyebrow: "Everyday utility",
    summary:
      "Cash denomination totals with bundle counting, dated history, optional notes, and persistent records.",
    impact:
      "A repetitive manual calculation becomes a fast, reliable workflow with full CRUD history.",
    role: "Product engineering · Utility design",
    year: "2025",
    image: "/images/currency-calculator.png",
    imageHeight: 1672,
    imageAlt: "Currency Calculator full-width denomination interface",
    href: "https://studio.jayantgoyal.com/calculator/new",
    github: studioRepository,
    tags: ["Next.js", "Supabase", "CRUD", "Responsive UI"],
    tone: "signal",
  },
  {
    id: "custom-calculator",
    title: "Custom Calculator",
    eyebrow: "Drag-and-drop builder",
    summary:
      "A calculator users can assemble themselves by arranging operations and controls around their workflow.",
    impact:
      "Drag-and-drop composition, duplicate prevention, history actions, and persisted state turn a calculator into a small builder.",
    role: "Interaction engineering · State design",
    year: "2025",
    image: "/images/custom-calculator.png",
    imageHeight: 1674,
    imageAlt: "Custom Calculator full-width drag-and-drop builder interface",
    href: "https://studio.jayantgoyal.com/custom-calculator",
    github: studioRepository,
    tags: ["React", "Zustand", "Drag and drop", "Tailwind CSS"],
    tone: "paper",
  },
  {
    id: "weather",
    title: "Weather",
    eyebrow: "Location-aware forecast",
    summary:
      "City search, geolocation, current conditions, and a responsive multi-day forecast.",
    impact:
      "A familiar utility focused on fast scanning, graceful location access, and useful forecast context.",
    role: "Frontend engineering · API integration",
    year: "2025",
    image: "/images/weather.png",
    imageHeight: 1672,
    imageAlt: "Weather application full-width forecast interface",
    href: "https://studio.jayantgoyal.com/weather",
    github: studioRepository,
    tags: ["Next.js", "TypeScript", "OpenWeather", "Geolocation"],
    tone: "ink",
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    eyebrow: "Product and cart experience",
    summary:
      "Responsive product browsing, cart state, authentication, and live API-backed catalog updates.",
    impact:
      "A complete commerce flow built to connect discovery, product decisions, and transaction-ready state.",
    role: "Frontend engineering · Application state",
    year: "2024",
    image: "/images/ecommerce.png",
    imageHeight: 1602,
    imageAlt: "E-commerce application full-width product catalog interface",
    href: "https://ecommerce.jayantgoyal.com/",
    github: "https://github.com/goyal1510/jayant-ecommerce-website",
    tags: ["React", "Redux", "React Router", "API integration"],
    tone: "signal",
  },
];

export const credentials: PortfolioCredential[] = [
  {
    name: "HackerRank Basic",
    issuer: "HackerRank",
    category: "Programming",
    href: "/documents/certificates/hackerrank-basic.pdf",
    image: "/images/certificates/hackerrank-basic.png",
    imageWidth: 2481,
    imageHeight: 1890,
    imageAlt: "HackerRank Problem Solving Basic certificate for Jayant Goyal",
  },
  {
    name: "HackerRank Intermediate",
    issuer: "HackerRank",
    category: "Programming",
    href: "/documents/certificates/hackerrank-intermediate.pdf",
    image: "/images/certificates/hackerrank-intermediate.png",
    imageWidth: 2481,
    imageHeight: 1890,
    imageAlt:
      "HackerRank Problem Solving Intermediate certificate for Jayant Goyal",
  },
  {
    name: "Internship Appreciation",
    issuer: "HighRadius",
    category: "Internship",
    href: "/documents/certificates/highradius-appreciation.pdf",
    image: "/images/certificates/highradius-appreciation.png",
    imageWidth: 1754,
    imageHeight: 1241,
    imageAlt: "HighRadius internship appreciation certificate for Jayant Goyal",
  },
  {
    name: "Product Engineer Internship",
    issuer: "HighRadius",
    category: "Internship",
    href: "/documents/certificates/highradius-product-engineer.pdf",
    image: "/images/certificates/highradius-product-engineer.png",
    imageWidth: 1755,
    imageHeight: 1241,
    imageAlt:
      "HighRadius Product and Engineering internship certificate for Jayant Goyal",
  },
  {
    name: "Full Stack Development",
    issuer: "Internshala",
    category: "Training",
    href: "/documents/certificates/full-stack-development.pdf",
    image: "/images/certificates/full-stack-development.png",
    imageWidth: 1959,
    imageHeight: 1455,
    imageAlt: "Internshala Full Stack Development certificate for Jayant Goyal",
  },
];

export type BlogPreview = {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  tags: string[];
};

export const fallbackBlogPosts: BlogPreview[] = [
  {
    title:
      "How I Built a Live Resume Download with Google Docs, Next.js, and Vercel",
    slug: "live-resume-download-google-docs-nextjs-vercel",
    excerpt:
      "Replacing a static résumé PDF with a server-side Google Docs export that stays current without another deployment.",
    date: "18 Jun 2026",
    tags: ["Next.js", "Automation", "Vercel"],
  },
  {
    title: "How I Fixed 86 Unindexed Pages and Made My Site Google-Ready",
    slug: "fixing-google-indexing-seo",
    excerpt:
      "A practical account of restructuring authentication, metadata, and crawl paths to make the platform visible to search.",
    date: "03 May 2026",
    tags: ["SEO", "Next.js", "Web security"],
  },
  {
    title: "Introducing jayantgoyal.com — More Than a Portfolio",
    slug: "introducing-jayantgoyal-com",
    excerpt:
      "The architecture and reasoning behind a platform that combines a portfolio, 99+ tools, games, files, and messaging.",
    date: "30 Apr 2026",
    tags: ["Next.js", "Supabase", "Architecture"],
  },
];

export const principles: PortfolioPrinciple[] = [
  {
    title: "Find the signal",
    copy: "Start with the real user tension, not the requested interface.",
  },
  {
    title: "Shape the system",
    copy: "Turn messy constraints into a clear model that can survive change.",
  },
  {
    title: "Ship the feeling",
    copy: "Polish the moments that make a product feel fast, obvious, and alive.",
  },
  {
    title: "Learn in public",
    copy: "Release, observe, and let real use sharpen the next decision.",
  },
];

export const navigation: PortfolioNavigationItem[] = [
  { key: "about", label: "About", note: "Story" },
  { key: "skills", label: "Skills", note: "Capabilities" },
  { key: "experience", label: "Experience", note: "Timeline" },
  { key: "activity", label: "Activity", note: "GitHub" },
  { key: "work", label: "Work", note: "Projects" },
  { key: "writing", label: "Writing", note: "Journal" },
];

export const sectionContent: PortfolioSectionContentMap = {
  skills: {
    eyebrow: "Capabilities / Across the stack",
    headline:
      "Broad enough to own the path. Focused enough to sweat the details.",
    accent: "",
    description:
      "The tools I use to shape interfaces, systems, data, and the space between them.",
    supportingText: "",
  },
  education: {
    eyebrow: "Education / Foundation",
    headline: "Where the foundation was built.",
    accent: "",
    description: "",
    supportingText: "",
  },
  experience: {
    eyebrow: "Career / The path so far",
    headline: "Each role moved me closer to the whole product.",
    accent: "",
    description:
      "What began in enterprise engineering now spans product thinking, systems, interfaces, and the responsibility of shipping them together.",
    supportingText: "",
  },
  credentials: {
    eyebrow: "Credentials / Milestones",
    headline: "A few milestones, kept in one deck.",
    accent: "",
    description:
      "Formal chapters from the learning and internships behind the work.",
    supportingText: "",
  },
  activity: {
    eyebrow: "Open source / GitHub",
    headline: "The work between the launches.",
    accent: "",
    description:
      "A live view of the repositories, languages, and contribution rhythm behind the public work.",
    supportingText: "",
  },
  work: {
    eyebrow: "Selected work / Product systems",
    headline: "Built for real days, real people, and real pressure.",
    accent: "",
    description:
      "A selection spanning developer tools, realtime collaboration, personal workflows, games, utilities, and commerce—designed and engineered from the first decision through delivery.",
    supportingText: "",
  },
  writing: {
    eyebrow: "Writing / Notes from the build",
    headline: "",
    accent: "",
    description: "",
    supportingText: "",
  },
  contact: {
    eyebrow: "Contact / Start a conversation",
    headline: "Have an idea with",
    accent: "sharp edges?",
    description:
      "Tell me what you are trying to make, where it feels difficult, and what a useful outcome would look like.",
    supportingText: "I normally reply within one business day.",
  },
};

export type PortfolioEditorialData = {
  profile: PortfolioProfile;
  about: PortfolioAbout;
  navigation: PortfolioNavigationItem[];
  sectionContent: PortfolioSectionContentMap;
  education: PortfolioEducation[];
  experience: PortfolioExperience[];
  skillGroups: PortfolioSkillGroup[];
  projects: PortfolioProject[];
  credentials: PortfolioCredential[];
  principles: PortfolioPrinciple[];
};

export const fallbackPortfolioData: PortfolioEditorialData = {
  profile: portfolioProfile,
  about,
  navigation,
  sectionContent,
  education,
  experience,
  skillGroups,
  projects,
  credentials,
  principles,
};
