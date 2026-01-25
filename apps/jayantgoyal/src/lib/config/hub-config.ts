import {
  Home,
  User,
  BrainCog,
  BriefcaseBusiness,
  Code2,
  Award,
  Mail,
  Gamepad2,
  Dices,
  Grid3X3,
  Swords,
  Circle,
  Brain,
  Wrench,
  Calculator,
  FolderOpen,
  FileText,
  LayoutDashboard,
  Target,
  Settings,
  Plus,
  History,
  MessageSquare,
  Cloud,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  color: string
  url?: string
}

export type AppConfig = {
  id: string
  name: string
  icon: LucideIcon
  color: string
  isPublic: boolean
  navItems: NavItem[]
}

// Portfolio navigation items (scroll-based sections)
const PORTFOLIO_NAV: NavItem[] = [
  { id: "home", label: "Home", icon: Home, color: "text-sky-600 dark:text-sky-400", url: "/portfolio#home" },
  { id: "about", label: "About", icon: User, color: "text-emerald-600 dark:text-emerald-400", url: "/portfolio#about" },
  { id: "skills", label: "Skills", icon: BrainCog, color: "text-amber-500 dark:text-amber-400", url: "/portfolio#skills" },
  { id: "experience", label: "Experience", icon: BriefcaseBusiness, color: "text-indigo-500 dark:text-indigo-400", url: "/portfolio#experience" },
  { id: "projects", label: "Projects", icon: Code2, color: "text-rose-500 dark:text-rose-400", url: "/portfolio#projects" },
  { id: "certificates", label: "Certificates", icon: Award, color: "text-cyan-600 dark:text-cyan-400", url: "/portfolio#certificates" },
  { id: "contact", label: "Contact", icon: Mail, color: "text-lime-600 dark:text-lime-400", url: "/portfolio#contact" },
]

// Game Hub navigation items
const GAME_HUB_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500 dark:text-blue-400", url: "/games" },
  { id: "rock-paper-scissors", label: "Rock Paper Scissors", icon: Dices, color: "text-purple-500 dark:text-purple-400", url: "/games/rock-paper-scissors" },
  { id: "tic-tac-toe", label: "Tic Tac Toe", icon: Grid3X3, color: "text-green-500 dark:text-green-400", url: "/games/tic-tac-toe" },
  { id: "dare-x", label: "Dare X", icon: Swords, color: "text-red-500 dark:text-red-400", url: "/games/dare-x" },
  { id: "connect-four", label: "Connect Four", icon: Circle, color: "text-yellow-500 dark:text-yellow-400", url: "/games/connect-four" },
  { id: "memory-match", label: "Memory Match", icon: Brain, color: "text-pink-500 dark:text-pink-400", url: "/games/memory-match" },
]

// Tech Tools - uses nested navigation from lib/tools/tools.ts
// This is just a placeholder, actual navigation is rendered from toolCategories

// File Manager navigation items
const FILE_MANAGER_NAV: NavItem[] = [
  { id: "files", label: "Files", icon: FolderOpen, color: "text-blue-500 dark:text-blue-400", url: "/files" },
  { id: "changelog", label: "Release Notes", icon: FileText, color: "text-gray-500 dark:text-gray-400", url: "/files/changelog" },
]

// Activity Tracker navigation items
const ACTIVITY_TRACKER_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500 dark:text-blue-400", url: "/activity-tracker/dashboard" },
  { id: "tracker", label: "Tracker", icon: Target, color: "text-green-500 dark:text-green-400", url: "/activity-tracker/tracker" },
  { id: "management", label: "Management", icon: Settings, color: "text-gray-500 dark:text-gray-400", url: "/activity-tracker/management" },
]

// Currency Calculator navigation items
const CURRENCY_CALC_NAV: NavItem[] = [
  { id: "new", label: "New", icon: Plus, color: "text-green-500 dark:text-green-400", url: "/calculator/new" },
  { id: "history", label: "History", icon: History, color: "text-blue-500 dark:text-blue-400", url: "/calculator/history" },
]

// Sync Messenger navigation items
const SYNC_MESSENGER_NAV: NavItem[] = [
  { id: "messenger", label: "Messenger", icon: MessageSquare, color: "text-blue-500 dark:text-blue-400", url: "/messenger" },
]

// All apps configuration
export const HUB_APPS: AppConfig[] = [
  {
    id: "portfolio",
    name: "Portfolio",
    icon: User,
    color: "text-emerald-500 dark:text-emerald-400",
    isPublic: true,
    navItems: PORTFOLIO_NAV,
  },
  {
    id: "game-hub",
    name: "Game Hub",
    icon: Gamepad2,
    color: "text-purple-500 dark:text-purple-400",
    isPublic: false,
    navItems: GAME_HUB_NAV,
  },
  {
    id: "file-manager",
    name: "File Manager",
    icon: FolderOpen,
    color: "text-blue-500 dark:text-blue-400",
    isPublic: false,
    navItems: FILE_MANAGER_NAV,
  },
  {
    id: "sync-messenger",
    name: "Sync Messenger",
    icon: MessageSquare,
    color: "text-blue-500 dark:text-blue-400",
    isPublic: false,
    navItems: SYNC_MESSENGER_NAV,
  },
  {
    id: "currency-calculator",
    name: "Currency Calculator",
    icon: Calculator,
    color: "text-amber-500 dark:text-amber-400",
    isPublic: false,
    navItems: CURRENCY_CALC_NAV,
  },
  {
    id: "activity-tracker",
    name: "Activity Tracker",
    icon: Target,
    color: "text-green-500 dark:text-green-400",
    isPublic: false,
    navItems: ACTIVITY_TRACKER_NAV,
  },
  {
    id: "tech-tools",
    name: "Tech Tools",
    icon: Wrench,
    color: "text-orange-500 dark:text-orange-400",
    isPublic: true,
    navItems: [], // Uses nested navigation from lib/tools/tools.ts
  },
  {
    id: "weather",
    name: "Weather",
    icon: Cloud,
    color: "text-sky-500 dark:text-sky-400",
    isPublic: true,
    navItems: [],
  },
  {
    id: "custom-calculator",
    name: "Custom Calculator",
    icon: Calculator,
    color: "text-violet-500 dark:text-violet-400",
    isPublic: true,
    navItems: [],
  },
]

// Get private apps
export const getPrivateApps = () => HUB_APPS.filter((app) => !app.isPublic)

// Get public apps
export const getPublicApps = () => HUB_APPS.filter((app) => app.isPublic)

// Get app by ID
export const getAppById = (id: string) => HUB_APPS.find((app) => app.id === id)
