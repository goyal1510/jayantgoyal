export type OpportunityStatus =
  | "discovered"
  | "shortlisted"
  | "preparing"
  | "ready_for_review"
  | "approved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "closed"
  | "skipped";

export interface CareerCompany {
  id: string;
  name: string;
  canonical_url: string | null;
  careers_url: string | null;
}

export interface CareerOpportunity {
  id: string;
  company_id: string;
  source: "wellfound" | "linkedin" | "career_page" | "referral" | "manual";
  source_url: string;
  apply_url: string | null;
  title: string;
  location_text: string | null;
  work_policy: "remote" | "hybrid" | "onsite" | "unknown";
  salary_text: string | null;
  fit_score: number | null;
  fit_summary: string | null;
  status: OpportunityStatus;
  discovered_at: string;
  last_seen_at: string;
}

export interface CareerApplication {
  id: string;
  opportunity_id: string;
  status:
    | "submitted"
    | "viewed"
    | "in_review"
    | "interviewing"
    | "offer"
    | "rejected"
    | "withdrawn"
    | "unknown";
  submitted_at: string;
  last_checked_at: string | null;
  reply_received_at: string | null;
}

export interface CareerContact {
  id: string;
  company_id: string;
  full_name: string;
  title: string | null;
  profile_url: string;
}

export interface CareerOutreach {
  id: string;
  contact_id: string;
  opportunity_id: string | null;
  channel: "linkedin" | "email" | "wellfound" | "other";
  status:
    | "draft"
    | "ready_for_review"
    | "approved"
    | "sent"
    | "replied"
    | "declined"
    | "failed"
    | "cancelled";
  sent_at: string | null;
  replied_at: string | null;
}

export interface CareerAutomationRun {
  id: string;
  kind: "discovery" | "status_sync";
  status: "running" | "succeeded" | "partial" | "failed";
  started_at: string;
  completed_at: string | null;
  discovered_count: number;
  shortlisted_count: number;
  prepared_count: number;
  submitted_count: number;
  reply_count: number;
  error_text: string | null;
}

export interface CareerOverview {
  companies: CareerCompany[];
  opportunities: CareerOpportunity[];
  applications: CareerApplication[];
  contacts: CareerContact[];
  outreach: CareerOutreach[];
  runs: CareerAutomationRun[];
}
