export interface ShortUrl {
  id: string;
  slug: string;
  target_url: string;
  title: string | null;
  clicks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClickEvent {
  id: string;
  short_url_id: string;
  clicked_at: string;
  user_agent: string | null;
  referer: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export type UserRole = "admin" | "super_admin" | "user";
