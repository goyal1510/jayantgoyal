import { createSupabaseServiceRoleClient } from "@jayantgoyal/web-auth/service-role";
import type {
  CareerApplication,
  CareerAutomationRun,
  CareerCompany,
  CareerContact,
  CareerOpportunity,
  CareerOutreach,
  CareerOverview,
} from "@/lib/career-types";

/** Load the private career pipeline after the caller has passed an Admin capability check. */
export async function loadCareerOverview(): Promise<CareerOverview> {
  const client = createSupabaseServiceRoleClient();
  const career = client.schema("career");
  const [companies, opportunities, applications, contacts, outreach, runs] =
    await Promise.all([
      career
        .from("companies")
        .select("id,name,canonical_url,careers_url")
        .order("name"),
      career
        .from("opportunities")
        .select(
          "id,company_id,source,source_url,apply_url,title,location_text,work_policy,salary_text,fit_score,fit_summary,status,discovered_at,last_seen_at",
        )
        .order("discovered_at", { ascending: false })
        .limit(250),
      career
        .from("applications")
        .select(
          "id,opportunity_id,status,submitted_at,last_checked_at,reply_received_at",
        )
        .order("submitted_at", { ascending: false })
        .limit(250),
      career
        .from("contacts")
        .select("id,company_id,full_name,title,profile_url")
        .order("updated_at", { ascending: false })
        .limit(250),
      career
        .from("outreach")
        .select(
          "id,contact_id,opportunity_id,channel,status,sent_at,replied_at",
        )
        .order("updated_at", { ascending: false })
        .limit(250),
      career
        .from("automation_runs")
        .select(
          "id,kind,status,started_at,completed_at,discovered_count,shortlisted_count,prepared_count,submitted_count,reply_count,error_text",
        )
        .order("started_at", { ascending: false })
        .limit(20),
    ]);

  const error =
    companies.error ??
    opportunities.error ??
    applications.error ??
    contacts.error ??
    outreach.error ??
    runs.error;
  if (error) throw new Error(error.message);

  return {
    companies: (companies.data ?? []) as CareerCompany[],
    opportunities: (opportunities.data ?? []) as CareerOpportunity[],
    applications: (applications.data ?? []) as CareerApplication[],
    contacts: (contacts.data ?? []) as CareerContact[],
    outreach: (outreach.data ?? []) as CareerOutreach[],
    runs: (runs.data ?? []) as CareerAutomationRun[],
  };
}
