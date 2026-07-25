begin;

update portfolio.hero
set
  headline = 'I build ambitious SaaS products from first question to production.',
  blurb = 'I''m Jayant, a full-stack product engineer who turns ambiguous product problems into secure, dependable software and owns the path through delivery.',
  tagline = 'Complete SaaS products',
  availability = 'Available for selective startup, product, and engineering collaborations.',
  seo_title = 'Jayant Goyal | Full-Stack Product Engineer',
  seo_description = 'Jayant Goyal is a full-stack product engineer who builds complete SaaS products across product decisions, interfaces, application systems, data, security, and delivery.';

update portfolio.section_content
set eyebrow = 'Portfolio / 2026'
where section_key = 'hero';

update portfolio.section_content
set
  headline = 'Complete product systems, not isolated demos.',
  description = 'Selected work across SaaS architecture, secure storage, realtime systems, recurring-use products, and developer infrastructure—built from the first product decision through delivery.'
where section_key = 'work';

update portfolio.projects as project
set
  name = positioning.name,
  eyebrow = positioning.eyebrow,
  short_description = positioning.short_description,
  impact = positioning.impact,
  contribution = positioning.contribution,
  tags = positioning.tags,
  sort_order = positioning.sort_order,
  is_visible = positioning.is_visible
from (
  values
    (
      'tech-tools',
      'Tech Tools',
      'Registry-driven utility platform',
      '87 generators, converters, parsers, validators, formatters, and code tools in one searchable workspace.',
      'A typed registry, shared interaction patterns, persisted favorites, metadata, and usage synchronization turn repeated utilities into an extensible product system.',
      'Product engineering · Platform architecture',
      array['Next.js App Router', 'Typed tool registry', 'Zustand persistence', 'Supabase usage sync']::text[],
      0,
      true
    ),
    (
      'file-manager',
      'File Manager',
      'Secure hierarchical storage',
      'Private folders, uploads, previews, search, move and copy operations, signed access, and recoverable deletion.',
      'A relational folder hierarchy and private object storage keep user files organized without exposing storage objects publicly.',
      'Full-stack engineering · Storage security',
      array['Next.js App Router', 'Supabase Storage', 'PostgreSQL hierarchy', 'Signed URLs and RLS']::text[],
      1,
      true
    ),
    (
      'game-hub',
      'Game Hub',
      'Realtime game platform',
      'Nine games spanning solo, local, computer, and room-based multiplayer modes.',
      'Shared session, participant, move, and result models support multiple game rules while Supabase Realtime keeps online rooms synchronized.',
      'Game systems · Realtime state',
      array['Next.js App Router', 'PostgreSQL session model', 'Supabase Realtime', 'Auth and RLS']::text[],
      2,
      true
    ),
    (
      'activity-tracker',
      'Activity Tracker',
      'Recurring-use activity product',
      'Low-friction daily tracking, month navigation, completion rates, and progress views for custom activities.',
      'Authenticated relational data turns repeated daily entries into useful progress feedback while user-scoped policies keep records private.',
      'Product engineering · Data experience',
      array['Next.js App Router', 'PostgreSQL', 'Supabase Auth', 'RLS']::text[],
      3,
      true
    ),
    (
      'sync-messenger',
      'Sync Scratchpad',
      'Private realtime scratchpad',
      'A focused authenticated stream for moving temporary text, links, and notes between personal devices.',
      'Supabase subscriptions synchronize a durable private stream across sessions without overstating the product as a person-to-person conversation platform.',
      'Full-stack engineering · Realtime state',
      array['Next.js App Router', 'Supabase Realtime', 'PostgreSQL', 'Auth and RLS']::text[],
      4,
      true
    ),
    (
      'custom-calculator',
      'Custom Drag & Drop Calculator',
      'User-configured interaction builder',
      'A calculator users assemble around their workflow by arranging operations and controls.',
      'Drag-and-drop composition, duplicate prevention, history actions, hydration handling, and persisted client state turn a fixed utility into a configurable tool.',
      'Interaction engineering · State design',
      array['React', 'react-dnd', 'Zustand persist', 'Hydration-safe state']::text[],
      5,
      true
    ),
    (
      'ecommerce',
      'E-commerce Application',
      'MERN storefront foundation',
      'An earlier full-stack storefront with product browsing, authentication, cart state, and an API-backed catalog.',
      'The project demonstrates a separated React and Express architecture; payments, order processing, and administration remain future work.',
      'Full-stack foundation · MERN architecture',
      array['React and Vite', 'Redux Toolkit', 'Express and Mongoose', 'JWT and bcrypt']::text[],
      6,
      true
    ),
    (
      'currency-calculator',
      'Currency Calculator',
      'Everyday utility',
      'Cash denomination totals with bundle counting, dated history, optional notes, and persistent records.',
      'A repetitive manual calculation becomes a fast, reliable workflow with user-scoped history.',
      'Product engineering · Utility design',
      array['Next.js App Router', 'PostgreSQL', 'Supabase Auth', 'RLS']::text[],
      7,
      false
    ),
    (
      'weather',
      'Weather App',
      'Location-aware forecast',
      'City search, geolocation, current conditions, and a responsive multi-day forecast.',
      'A familiar utility focused on fast scanning, graceful location access, and useful forecast context.',
      'Frontend engineering · API integration',
      array['Next.js App Router', 'OpenWeather API', 'Browser geolocation', 'Responsive data states']::text[],
      8,
      false
    )
) as positioning(
  slug,
  name,
  eyebrow,
  short_description,
  impact,
  contribution,
  tags,
  sort_order,
  is_visible
)
where project.slug = positioning.slug;

commit;
