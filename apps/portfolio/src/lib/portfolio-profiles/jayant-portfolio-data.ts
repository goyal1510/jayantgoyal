import {
  Award,
  BrainCog,
  BriefcaseBusiness,
  Code2,
  Github,
  Instagram,
  Home,
  Linkedin,
  Mail,
  Sparkles,
  User,
} from "lucide-react"

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, color: "text-sky-600 dark:text-sky-400" },
  { id: "about", label: "About", icon: User, color: "text-emerald-600 dark:text-emerald-400" },
  { id: "skills", label: "Skills", icon: BrainCog, color: "text-amber-500 dark:text-amber-400" },
  { id: "experience", label: "Experience", icon: BriefcaseBusiness, color: "text-indigo-500 dark:text-indigo-400" },
  { id: "projects", label: "Projects", icon: Code2, color: "text-rose-500 dark:text-rose-400" },
  { id: "certificates", label: "Certificates", icon: Award, color: "text-cyan-600 dark:text-cyan-400" },
  { id: "contact", label: "Contact", icon: Mail, color: "text-lime-600 dark:text-lime-400" },
] as const

const HERO = {
  name: "Jayant",
  role: "Full Stack Developer",
  tagline:
    "I create beautiful, functional, and user-centered digital experiences. Passionate about clean code, modern technologies, and solving complex problems.",
  blurb:
    "I love pairing fast iteration with thoughtful craft—shipping early, measuring, and polishing with every release.",
  location: "Hyderabad, India",
}

const ABOUT = {
  summary:
    "Get to know me better - my journey, passion, and what drives me to create amazing digital experiences.",
  personal: [
    { label: "Name", value: "Jayant" },
    { label: "Location", value: "Hyderabad, India" },
    { label: "Experience", value: "1+ Years" },
    { label: "Email", value: "goyal151002@gmail.com" },
    { label: "Phone", value: "+91 94134 95328" },
    { label: "Current Role", value: "Associate Product Engineer" },
  ],
  highlights: [
    "Full Stack Web Development",
    "React.js & Next.js Development",
    "TypeScript & JavaScript",
    "REST API Design & Implementation",
    "Database Management (MongoDB, Supabase)",
    "UI/UX Design & User Experience",
  ],
}

const EDUCATION = [
  {
    school: "A.S.M. Public School, Sri Ganganagar",
    degree: "Secondary (X), CBSE",
    period: "2018",
    location: "Sri Ganganagar",
    detail: "Percentage: 86.20%",
  },
  {
    school: "Nosegay Public School, Sri Ganganagar",
    degree: "Senior Secondary (XII), CBSE",
    period: "2020",
    location: "Sri Ganganagar",
    detail: "Percentage: 83.20%",
  },
  {
    school: "Kalinga Institute of Industrial Technology, Bhubaneshwar",
    degree: "Bachelor of Technology (B.Tech), Computer Science & Engineering",
    period: "2024",
    location: "Bhubaneshwar",
    detail: "CGPA: 8.98/10",
  },
] as const

const EXPERIENCE = [
  {
    company: "Neuraoak Technologies Private Limited",
    role: "Product Associate Engineer",
    period: "Mar 2025 - Present",
    location: "Hyderabad",
    summary:
      "Building RCM software features using Next.js (TypeScript) and Supabase, improving billing workflows and automating claims processing.",
    bullets: [
      "Built RCM software features using Next JS (TypeScript) and Supabase, improving billing workflows.",
      "Automated claims processing, reducing manual effort by 40% and errors by 25%.",
      "Integrated Supabase for real-time data and auth, cutting backend load by 30%.",
      "Led UI improvements based on user feedback, boosting satisfaction.",
    ],
  },
  {
    company: "HighRadius Technologies Private Ltd.",
    role: "Software Development Intern",
    period: "Jul 2023 - Nov 2023",
    location: "Bhubaneswar",
    summary:
      "Designed and implemented REST APIs and optimized performance using Java technologies.",
    bullets: [
      "Designed and implemented 15+ REST APIs, enabling seamless integration with multiple front-end apps and third-party services.",
      "Optimized performance using Java, SQL, Hibernate, Struts, and Spring, improving response times by 30%.",
      "Mastered user requirements, UX design, and backend development for comprehensive product approach.",
    ],
  },
  {
    company: "HighRadius Technologies Private Ltd.",
    role: "Tech Summer Intern",
    period: "May 2023 - Jul 2023",
    location: "Bhubaneswar",
    summary:
      "Spearheaded the creation of a full-stack web product, ensuring seamless integration across components.",
    bullets: [
      "Spearheaded the creation of a full-stack web product with end-to-end ownership.",
      "Mastered user requirements, UX design, and backend development for a comprehensive product approach.",
    ],
  },
  {
    company: "DESIRE FOUNDATION",
    role: "Public Relations (PR) Intern",
    period: "Sep 2022 - Aug 2023",
    location: "Bhubaneswar",
    summary:
      "Organized fieldwork campaigns and collaborated with cross-functional teams to enhance internal coordination.",
    bullets: [
      "Organized a fieldwork campaign in slum areas, reaching 50+ children and their families, encouraging education.",
      "Engaged with parents and distributed 100+ notebooks to support education.",
      "Collaborated with cross-functional teams to organize meetings and enhance internal coordination.",
    ],
  },
] as const

const SKILL_SETS = [
  {
    title: "Frontend Development",
    icon: Code2,
    color: "text-orange-500 dark:text-orange-400",
    items: [
      { name: "HTML", level: 95 },
      { name: "CSS3", level: 92 },
      { name: "JavaScript", level: 88 },
      { name: "TypeScript", level: 85 },
      { name: "React", level: 90 },
      { name: "Next.js", level: 85 },
      { name: "Redux", level: 80 },
      { name: "Tailwind CSS", level: 92 },
    ],
  },
  {
    title: "Backend Development",
    icon: Sparkles,
    color: "text-emerald-500 dark:text-emerald-400",
    items: [
      { name: "Node.js", level: 85 },
      { name: "Express.js", level: 88 },
      { name: "MongoDB", level: 82 },
      { name: "MySQL", level: 78 },
      { name: "Supabase", level: 75 },
      { name: "JWT", level: 80 },
    ],
  },
  {
    title: "Tools & Technologies",
    icon: BrainCog,
    color: "text-indigo-500 dark:text-indigo-400",
    items: [
      { name: "Git", level: 90 },
      { name: "GitHub", level: 88 },
      { name: "Vercel", level: 85 },
      { name: "Vite", level: 80 },
      { name: "NPM", level: 92 },
      { name: "PNPM", level: 85 },
      { name: "Bruno", level: 85 },
    ],
  },
  {
    title: "Programming Languages",
    icon: BriefcaseBusiness,
    color: "text-rose-500 dark:text-rose-400",
    items: [
      { name: "Java", level: 70 },
      { name: "Markdown", level: 60 },
      { name: "Python", level: 40 },
      { name: "C++", level: 60 },
    ],
  },
] as const

const TECH_ICONS = [
  { icon: Code2, name: "HTML", color: "text-orange-500" },
  { icon: BrainCog, name: "CSS3", color: "text-blue-500" },
  { icon: Code2, name: "JavaScript", color: "text-yellow-500" },
  { icon: Code2, name: "TypeScript", color: "text-blue-600" },
  { icon: Code2, name: "React", color: "text-cyan-500" },
  { icon: Code2, name: "Next.js", color: "text-gray-800" },
  { icon: Code2, name: "Node.js", color: "text-green-600" },
  { icon: BrainCog, name: "Git", color: "text-orange-600" },
  { icon: Sparkles, name: "Vite", color: "text-yellow-500" },
  { icon: BrainCog, name: "Tailwind", color: "text-teal-500" },
  { icon: BrainCog, name: "JWT", color: "text-purple-500" },
] as const

const PROJECTS = [
  {
    name: "Currency Calculator",
    shortDescription:
      "Developed a personal calculator to total cash denomination, store multiple calculations per date, and add optional notes.",
    fullDescription:
      "Developed a personal calculator to total cash denomination, store multiple calculations per date, and add optional notes. Integrated Supabase for backend storage with full CRUD functionality. Built with React and custom external CSS for a clean, responsive UI and smooth user interactions. Features include bundle counting, historical tracking, and data persistence.",
    image: "/assets/ProjectImages/work-7.png",
    tags: ["React", "Supabase", "CSS", "CRUD Operations"],
    githubLink:
      "https://github.com/goyal1510/jayantgoyal/tree/main/apps/currency-calculator",
    liveLink: "https://ccal.jayantgoyal.com",
  },
  {
    name: "Custom Drag & Drop Calculator",
    shortDescription: "Built a drag-and-drop calculator using React and Zustand.",
    fullDescription:
      "Built a drag-and-drop calculator using React and Zustand. Added dark mode, backspace, clear all, and duplicate prevention. Styled with Tailwind CSS and optimized with Vite. Features a calculator builder with drag-and-drop functionality.",
    image: "/assets/ProjectImages/work-1.png",
    tags: ["React", "Zustand", "Tailwind CSS", "Vite", "Drag & Drop"],
    githubLink:
      "https://github.com/goyal1510/jayantgoyal/tree/main/apps/custom-drag-drop-calculator",
    liveLink: "https://customcal.jayantgoyal.com",
  },
  {
    name: "E-commerce Application",
    shortDescription:
      "Built a full-featured e-commerce platform with product browsing, cart, and transactions.",
    fullDescription:
      "Built a full-featured e-commerce platform with product browsing, cart, and transactions. Developed a responsive UI using React, React Router, and Redux. Integrated an API for real-time product updates. Features include authentication, cart functionality, and product management.",
    image: "/assets/ProjectImages/work-3.png",
    tags: ["React", "Redux", "React Router", "API Integration"],
    githubLink:
      "https://github.com/goyal1510/jayant-ecommerce-website",
    liveLink: "https://ecommerce.jayant.org.in/",
  },
  {
    name: "Game Hub",
    shortDescription:
      "Developed a Game Hub featuring three interactive games: Rock Paper Scissors, Dare You, and Tic Tac Toe.",
    fullDescription:
      "Developed a Game Hub featuring three interactive games: Rock Paper Scissors, Dare You, and Tic Tac Toe. Utilized HTML, CSS, and JavaScript to ensure simplicity and ease of use. A gaming platform where users can explore and play various games.",
    image: "/assets/ProjectImages/work-2.png",
    tags: ["Next.js","Interactive Games"],
    githubLink:
      "https://github.com/goyal1510/jayantgoyal/tree/main/apps/game-hub",
    liveLink: "https://ghub.jayantgoyal.com",
  },
  {
    name: "Weather App",
    shortDescription:
      "Developed a weather application using JavaScript, OpenWeather API, and Tailwind CSS.",
    fullDescription:
      "Developed a weather application using JavaScript, OpenWeather API, and Tailwind CSS. Implemented city-based search and geolocation-based weather retrieval. Designed a responsive UI for a seamless experience across devices.",
    image: "/assets/ProjectImages/work-4.png",
    tags: ["JavaScript", "OpenWeather API", "Tailwind CSS", "Geolocation"],
    githubLink: "https://github.com/goyal1510/jayantgoyal/tree/main/apps/weather",
    liveLink: "https://weather.jayantgoyal.com",
  },
] as const

const CERTIFICATES = [
  {
    name: "Hackerrank Basic",
    path: "/assets/certificates/HackerRank/Basic.pdf",
    description: "Certified in Hackerrank Basic assessment",
    category: "Programming",
    issuer: "HackerRank",
  },
  {
    name: "Hackerrank Intermediate",
    path: "/assets/certificates/HackerRank/Intermediate.pdf",
    description: "Certified in Hackerrank Intermediate assessment",
    category: "Programming",
    issuer: "HackerRank",
  },
  {
    name: "HighRadius Internship Appreciation",
    path: "/assets/certificates/HighRadius/Appreciation.pdf",
    description: "Received appreciation for my internship at HighRadius",
    category: "Internship",
    issuer: "HighRadius",
  },
  {
    name: "HighRadius Internship Completion",
    path: "/assets/certificates/HighRadius/Product_Engineer.pdf",
    description: "Successfully completed my internship at HighRadius",
    category: "Internship",
    issuer: "HighRadius",
  },
  {
    name: "Full Stack Training",
    path: "/assets/certificates/Internshalla/LetsBegin.pdf",
    description: "Completed Full Stack training from Internshalla",
    category: "Training",
    issuer: "Internshalla",
  },
  {
    name: "HTML & CSS Training",
    path: "/assets/certificates/Internshalla/HTMLCSS.pdf",
    description: "Completed HTML and CSS training from Internshalla",
    category: "Training",
    issuer: "Internshalla",
  },
  {
    name: "Interactive JavaScript Training",
    path: "/assets/certificates/Internshalla/JavaScript.pdf",
    description: "Completed interactive JavaScript training from Internshalla",
    category: "Training",
    issuer: "Internshalla",
  },
  {
    name: "Git and GitHub Training",
    path: "/assets/certificates/Internshalla/Git_GitHub.pdf",
    description: "Completed Git and GitHub training from Internshalla",
    category: "Training",
    issuer: "Internshalla",
  },
  {
    name: "DSA JavaScript I",
    path: "/assets/certificates/Internshalla/Dsa1.pdf",
    description: "Completed DSA JavaScript Level I training from Internshalla",
    category: "Training",
    issuer: "Internshalla",
  },
  {
    name: "DSA JavaScript II",
    path: "/assets/certificates/Internshalla/Dsa2.pdf",
    description: "Completed DSA JavaScript Level II training from Internshalla",
    category: "Training",
    issuer: "Internshalla",
  },
  {
    name: "React Training",
    path: "/assets/certificates/Internshalla/React.pdf",
    description: "Completed React training from Internshalla",
    category: "Training",
    issuer: "Internshalla",
  },
  {
    name: "Node.js and MongoDB Training",
    path: "/assets/certificates/Internshalla/Node.js_Express.js_MongoDB.pdf",
    description:
      "Completed Node.js, Express.js, and MongoDB training from Internshalla",
    category: "Training",
    issuer: "Internshalla",
  },
] as const

const CONTACT = {
  email: "goyal151002@gmail.com",
  phone: "+91 94134 95328",
  location: "Hyderabad, India",
  socials: [
    {
      label: "GitHub",
      href: "https://github.com/goyal1510",
      icon: Github,
      color: "text-gray-900 dark:text-gray-100",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/jayant-29714220b/",
      icon: Linkedin,
      color: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/goyal_1510/",
      icon: Instagram,
      color: "text-pink-500 dark:text-pink-400",
    },
  ],
} as const

export const jayantPortfolioData = {
  NAV_ITEMS,
  HERO,
  ABOUT,
  EDUCATION,
  EXPERIENCE,
  SKILL_SETS,
  TECH_ICONS,
  PROJECTS,
  CERTIFICATES,
  CONTACT,
} as const
