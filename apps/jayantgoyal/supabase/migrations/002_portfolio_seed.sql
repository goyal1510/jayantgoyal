-- Portfolio Seed Data
-- Migrates current hardcoded data from jayant-portfolio-data.ts to database

-- ============================================================================
-- NAV_ITEMS
-- ============================================================================
INSERT INTO portfolio.nav_items (section_id, label, icon_key, color, sort_order) VALUES
  ('home', 'Home', 'Home', 'text-sky-600 dark:text-sky-400', 0),
  ('about', 'About', 'User', 'text-emerald-600 dark:text-emerald-400', 1),
  ('skills', 'Skills', 'BrainCog', 'text-amber-500 dark:text-amber-400', 2),
  ('experience', 'Experience', 'BriefcaseBusiness', 'text-indigo-500 dark:text-indigo-400', 3),
  ('projects', 'Projects', 'Code2', 'text-rose-500 dark:text-rose-400', 4),
  ('certificates', 'Certificates', 'Award', 'text-cyan-600 dark:text-cyan-400', 5),
  ('contact', 'Contact', 'Mail', 'text-lime-600 dark:text-lime-400', 6);

-- ============================================================================
-- HERO
-- ============================================================================
INSERT INTO portfolio.hero (name, role, tagline, blurb, location) VALUES
  (
    'Jayant',
    'Full Stack Developer',
    'Building clean, functional web experiences with modern technologies.',
    'I love pairing fast iteration with thoughtful craft—shipping early, measuring, and polishing with every release.',
    'Hyderabad, India'
  );

-- ============================================================================
-- ABOUT
-- ============================================================================
INSERT INTO portfolio.about (summary, personal, highlights) VALUES
  (
    'Get to know me better - my journey, passion, and what drives me to create amazing digital experiences.',
    '[
      {"label": "Name", "value": "Jayant"},
      {"label": "Location", "value": "Hyderabad, India"},
      {"label": "Experience", "value": "1+ Years"},
      {"label": "Email", "value": "goyal151002@gmail.com"},
      {"label": "Phone", "value": "+91 94134 95328"},
      {"label": "Current Role", "value": "Associate Product Engineer"}
    ]'::jsonb,
    '[
      "Full Stack Web Development",
      "React.js & Next.js Development",
      "TypeScript & JavaScript",
      "REST API Design & Implementation",
      "Database Management (PostgreSQL, Supabase)",
      "UI/UX Design & User Experience"
    ]'::jsonb
  );

-- ============================================================================
-- EDUCATION
-- ============================================================================
INSERT INTO portfolio.education (school, degree, period, location, detail, sort_order) VALUES
  ('A.S.M. Public School, Sri Ganganagar', 'Secondary (X), CBSE', '2018', 'Sri Ganganagar', 'Percentage: 86.20%', 0),
  ('Nosegay Public School, Sri Ganganagar', 'Senior Secondary (XII), CBSE', '2020', 'Sri Ganganagar', 'Percentage: 83.20%', 1),
  ('Kalinga Institute of Industrial Technology, Bhubaneshwar', 'Bachelor of Technology (B.Tech), Computer Science & Engineering', '2024', 'Bhubaneshwar', 'CGPA: 8.98/10', 2);

-- ============================================================================
-- EXPERIENCE
-- ============================================================================
INSERT INTO portfolio.experience (company, role, period, location, summary, bullets, sort_order) VALUES
  (
    'Neuraoak Technologies Private Limited',
    'Product Associate Engineer',
    'Mar 2025 - Present',
    'Hyderabad',
    'Building RCM software features using Next.js (TypeScript) and Supabase, improving billing workflows and automating claims processing.',
    '[
      "Built RCM software features using Next JS (TypeScript) and Supabase, improving billing workflows.",
      "Automated claims processing, reducing manual effort by 40% and errors by 25%.",
      "Integrated Supabase for real-time data and auth, cutting backend load by 30%.",
      "Led UI improvements based on user feedback, boosting satisfaction."
    ]'::jsonb,
    0
  ),
  (
    'HighRadius Technologies Private Ltd.',
    'Software Development Intern',
    'Jul 2023 - Nov 2023',
    'Bhubaneswar',
    'Designed and implemented REST APIs and optimized performance using Java technologies.',
    '[
      "Designed and implemented 15+ REST APIs, enabling seamless integration with multiple front-end apps and third-party services.",
      "Optimized performance using Java, SQL, Hibernate, Struts, and Spring, improving response times by 30%.",
      "Mastered user requirements, UX design, and backend development for comprehensive product approach."
    ]'::jsonb,
    1
  ),
  (
    'HighRadius Technologies Private Ltd.',
    'Tech Summer Intern',
    'May 2023 - Jul 2023',
    'Bhubaneswar',
    'Spearheaded the creation of a full-stack web product, ensuring seamless integration across components.',
    '[
      "Spearheaded the creation of a full-stack web product with end-to-end ownership.",
      "Mastered user requirements, UX design, and backend development for a comprehensive product approach."
    ]'::jsonb,
    2
  ),
  (
    'DESIRE FOUNDATION',
    'Public Relations (PR) Intern',
    'Sep 2022 - Aug 2023',
    'Bhubaneswar',
    'Organized fieldwork campaigns and collaborated with cross-functional teams to enhance internal coordination.',
    '[
      "Organized a fieldwork campaign in slum areas, reaching 50+ children and their families, encouraging education.",
      "Engaged with parents and distributed 100+ notebooks to support education.",
      "Collaborated with cross-functional teams to organize meetings and enhance internal coordination."
    ]'::jsonb,
    3
  );

-- ============================================================================
-- SKILL_CATEGORIES and SKILLS
-- ============================================================================
-- Frontend Development
INSERT INTO portfolio.skill_categories (id, title, icon_key, color, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Frontend Development', 'Code2', 'text-orange-500 dark:text-orange-400', 0);

INSERT INTO portfolio.skills (category_id, name, level, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'HTML', 95, 0),
  ('11111111-1111-1111-1111-111111111111', 'CSS3', 92, 1),
  ('11111111-1111-1111-1111-111111111111', 'Tailwind CSS', 92, 2),
  ('11111111-1111-1111-1111-111111111111', 'React', 90, 3),
  ('11111111-1111-1111-1111-111111111111', 'JavaScript', 88, 4),
  ('11111111-1111-1111-1111-111111111111', 'TypeScript', 85, 5),
  ('11111111-1111-1111-1111-111111111111', 'Next.js', 85, 6),
  ('11111111-1111-1111-1111-111111111111', 'Redux', 80, 7);

-- Backend Development
INSERT INTO portfolio.skill_categories (id, title, icon_key, color, sort_order) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Backend Development', 'Sparkles', 'text-emerald-500 dark:text-emerald-400', 1);

INSERT INTO portfolio.skills (category_id, name, level, sort_order) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Supabase', 95, 0),
  ('22222222-2222-2222-2222-222222222222', 'JWT', 90, 1),
  ('22222222-2222-2222-2222-222222222222', 'Node.js', 85, 2),
  ('22222222-2222-2222-2222-222222222222', 'PostgreSQL', 78, 3);

-- Tools & Technologies
INSERT INTO portfolio.skill_categories (id, title, icon_key, color, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Tools & Technologies', 'BrainCog', 'text-indigo-500 dark:text-indigo-400', 2);

INSERT INTO portfolio.skills (category_id, name, level, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Vercel', 95, 0),
  ('33333333-3333-3333-3333-333333333333', 'Git', 90, 1);

-- Programming Languages
INSERT INTO portfolio.skill_categories (id, title, icon_key, color, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Programming Languages', 'BriefcaseBusiness', 'text-rose-500 dark:text-rose-400', 3);

INSERT INTO portfolio.skills (category_id, name, level, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Java', 80, 0),
  ('44444444-4444-4444-4444-444444444444', 'Python', 40, 1);

-- ============================================================================
-- TECH_ICONS
-- ============================================================================
INSERT INTO portfolio.tech_icons (icon_key, name, color, sort_order) VALUES
  ('Code2', 'HTML', 'text-orange-500', 0),
  ('BrainCog', 'CSS3', 'text-blue-500', 1),
  ('Code2', 'JavaScript', 'text-yellow-500', 2),
  ('Code2', 'TypeScript', 'text-blue-600', 3),
  ('Code2', 'React', 'text-cyan-500', 4),
  ('Code2', 'Next.js', 'text-gray-800', 5),
  ('Code2', 'Node.js', 'text-green-600', 6),
  ('BrainCog', 'Git', 'text-orange-600', 7),
  ('Sparkles', 'Vite', 'text-yellow-500', 8),
  ('BrainCog', 'Tailwind', 'text-teal-500', 9),
  ('BrainCog', 'JWT', 'text-purple-500', 10);

-- ============================================================================
-- PROJECTS
-- ============================================================================
INSERT INTO portfolio.projects (name, short_description, full_description, image_light, image_dark, tags, github_link, live_link, sort_order) VALUES
  (
    'Currency Calculator',
    'Developed a personal calculator to total cash denomination, store multiple calculations per date, and add optional notes.',
    'Developed a personal calculator to total cash denomination, store multiple calculations per date, and add optional notes. Integrated Supabase for backend storage with full CRUD functionality. Built with React and custom external CSS for a clean, responsive UI and smooth user interactions. Features include bundle counting, historical tracking, and data persistence.',
    '/assets/ProjectImages/Light/calculator.png',
    '/assets/ProjectImages/Dark/calculator.png',
    '["Next.js", "Supabase", "CSS", "CRUD Operations"]'::jsonb,
    'https://github.com/goyal1510/jayantgoyal/tree/main/apps/jayantgoyal',
    'https://www.jayantgoyal.com/calculator/new',
    0
  ),
  (
    'Custom Drag & Drop Calculator',
    'Built a drag-and-drop calculator using React and Zustand.',
    'Built a drag-and-drop calculator using React and Zustand. Added dark mode, backspace, clear all, and duplicate prevention. Styled with Tailwind CSS and optimized with Vite. Features a calculator builder with drag-and-drop functionality.',
    '/assets/ProjectImages/Light/custom-calculator.png',
    '/assets/ProjectImages/Dark/custom-calculator.png',
    '["Next.js", "Tailwind CSS", "Drag & Drop"]'::jsonb,
    'https://github.com/goyal1510/jayantgoyal/tree/main/apps/jayantgoyal',
    'https://www.jayantgoyal.com/custom-calculator',
    1
  ),
  (
    'E-commerce Application',
    'Built a full-featured e-commerce platform with product browsing, cart, and transactions.',
    'Built a full-featured e-commerce platform with product browsing, cart, and transactions. Developed a responsive UI using React, React Router, and Redux. Integrated an API for real-time product updates. Features include authentication, cart functionality, and product management.',
    '/assets/ProjectImages/Light/ecommerce.png',
    '/assets/ProjectImages/Dark/ecommerce.png',
    '["React", "Redux", "React Router", "API Integration"]'::jsonb,
    'https://github.com/goyal1510/jayant-ecommerce-website',
    'https://ecommerce.jayantgoyal.com/',
    2
  ),
  (
    'Game Hub',
    'Developed a Game Hub featuring five interactive games: Rock Paper Scissors, Tic Tac Toe, Connect Four, Memory Match, and Dare X.',
    'Developed a Game Hub featuring five interactive games: Rock Paper Scissors, Tic Tac Toe, Connect Four, Memory Match, and Dare X. Built with Next.js 16, TypeScript, and Supabase for authentication. Features include animated coin drops in Connect Four, winning line highlighting, AI opponents with strategic gameplay, multiple difficulty levels in Memory Match, and comprehensive game state management. Includes both Player vs Player and Player vs Computer modes for most games.',
    '/assets/ProjectImages/Light/games.png',
    '/assets/ProjectImages/Dark/games.png',
    '["Next.js", "TypeScript", "Supabase", "Interactive Games", "AI Opponents"]'::jsonb,
    'https://github.com/goyal1510/jayantgoyal/tree/main/apps/jayantgoyal',
    'https://www.jayantgoyal.com/games',
    3
  ),
  (
    'Weather App',
    'Developed a weather application using Next.js, TypeScript, OpenWeather API, and Tailwind CSS.',
    'Developed a weather application using Next.js, TypeScript, OpenWeather API, and Tailwind CSS. Implemented city-based search and geolocation-based weather retrieval. Designed a responsive UI for a seamless experience across devices.',
    '/assets/ProjectImages/Light/weather.png',
    '/assets/ProjectImages/Dark/weather.png',
    '["Next.js", "TypeScript", "OpenWeather API", "Tailwind CSS", "Geolocation"]'::jsonb,
    'https://github.com/goyal1510/jayantgoyal/tree/main/apps/jayantgoyal',
    'https://www.jayantgoyal.com/weather',
    4
  ),
  (
    'Activity Tracker',
    'Supabase-authenticated activity tracking tool for monitoring daily activities with performance KPIs and dashboard analytics.',
    'Built a comprehensive activity tracking application using Next.js, TypeScript, and Supabase. Features include custom activity creation, daily checkbox-based tracking, month navigation, and a dashboard with real-time KPIs and performance metrics. Activities persist across months, allowing users to track their progress over time. Includes completion rates, progress bars, and user-specific data with full authentication support.',
    '/assets/ProjectImages/Light/activity-tracker.png',
    '/assets/ProjectImages/Dark/activity-tracker.png',
    '["Next.js", "TypeScript", "Supabase", "Dashboard", "Analytics"]'::jsonb,
    'https://github.com/goyal1510/jayantgoyal/tree/main/apps/jayantgoyal',
    'https://www.jayantgoyal.com/activity-tracker/dashboard',
    5
  ),
  (
    'Tech Tools',
    'A comprehensive collection of 99+ developer tools and utilities including generators, converters, parsers, validators, and formatters.',
    'Developed a comprehensive developer tools platform with 99+ utilities organized into 10 categories. Features include generators (UUID, ULID, tokens, RSA keys), hash & encryption tools, converters (date-time, base64, color, JSON/YAML/TOML/XML), text tools, parsers & validators, formatters, code & dev tools, network tools, media & QR generators, and calculators. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. Includes modern UI with dark mode, responsive design, collapsible sidebar navigation, and real-time updates.',
    '/assets/ProjectImages/Light/tools.png',
    '/assets/ProjectImages/Dark/tools.png',
    '["Next.js", "TypeScript", "React", "Developer Tools", "Utilities"]'::jsonb,
    'https://github.com/goyal1510/jayantgoyal/tree/main/apps/jayantgoyal',
    'https://www.jayantgoyal.com/tools',
    6
  ),
  (
    'File Manager',
    'Full-stack file management system with private storage, directory support, file operations, and user authentication.',
    'Built a complete file management system using Next.js and Supabase with hierarchical directory support. Features include user authentication, private file storage, file upload/download/preview, directory management (create, navigate, move, copy), file operations (rename, delete, restore), search and filtering capabilities. Implemented with a custom database schema using the fmanager schema, storage bucket management, Row-Level Security (RLS) policies, and a modern responsive UI. Supports file type categorization, versioning, and soft delete functionality.',
    '/assets/ProjectImages/Light/files.png',
    '/assets/ProjectImages/Dark/files.png',
    '["Next.js", "TypeScript", "Supabase", "File Storage", "Database"]'::jsonb,
    'https://github.com/goyal1510/jayantgoyal/tree/main/apps/jayantgoyal',
    'https://www.jayantgoyal.com/files',
    7
  ),
  (
    'Sync Messenger',
    'Real-time messaging application with Supabase authentication and instant message synchronization.',
    'Built a real-time messaging application using Next.js, TypeScript, and Supabase. Features include user authentication, real-time message updates using Supabase subscriptions, message history, and a clean responsive UI. Messages sync instantly across devices with full CRUD operations for managing conversations.',
    '/assets/ProjectImages/Light/messenger.png',
    '/assets/ProjectImages/Dark/messenger.png',
    '["Next.js", "TypeScript", "Supabase", "Real-time", "Messaging"]'::jsonb,
    'https://github.com/goyal1510/jayantgoyal/tree/main/apps/jayantgoyal',
    'https://www.jayantgoyal.com/messenger',
    8
  );

-- ============================================================================
-- CERTIFICATES
-- ============================================================================
INSERT INTO portfolio.certificates (name, path, description, category, issuer, sort_order) VALUES
  ('Hackerrank Basic', '/assets/certificates/HackerRank/Basic.pdf', 'Certified in Hackerrank Basic assessment', 'Programming', 'HackerRank', 0),
  ('Hackerrank Intermediate', '/assets/certificates/HackerRank/Intermediate.pdf', 'Certified in Hackerrank Intermediate assessment', 'Programming', 'HackerRank', 1),
  ('HighRadius Internship Appreciation', '/assets/certificates/HighRadius/Appreciation.pdf', 'Received appreciation for my internship at HighRadius', 'Internship', 'HighRadius', 2),
  ('HighRadius Internship Completion', '/assets/certificates/HighRadius/Product_Engineer.pdf', 'Successfully completed my internship at HighRadius', 'Internship', 'HighRadius', 3),
  ('Full Stack Development', '/assets/certificates/Internshalla/Full_Stack_Development.pdf', 'Completed Full Stack Web Development training covering HTML, CSS, JavaScript, React, Node.js, Express.js, and MongoDB', 'Training', 'Internshalla', 4);

-- ============================================================================
-- CONTACT
-- ============================================================================
INSERT INTO portfolio.contact (email, phone, location, socials) VALUES
  (
    'goyal151002@gmail.com',
    '+91 94134 95328',
    'Hyderabad, India',
    '[
      {"label": "GitHub", "href": "https://github.com/goyal1510", "icon_key": "Github", "color": "text-gray-900 dark:text-gray-100"},
      {"label": "LinkedIn", "href": "https://www.linkedin.com/in/jayant-29714220b/", "icon_key": "Linkedin", "color": "text-sky-600 dark:text-sky-400"},
      {"label": "Instagram", "href": "https://www.instagram.com/goyal_1510/", "icon_key": "Instagram", "color": "text-pink-500 dark:text-pink-400"}
    ]'::jsonb
  );
