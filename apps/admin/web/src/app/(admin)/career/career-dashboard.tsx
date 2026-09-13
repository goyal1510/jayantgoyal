import { ExternalLink, Mail, SearchCheck, Send, Sparkles } from "lucide-react";
import { Badge } from "@jayantgoyal/web-ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jayantgoyal/web-ui/table";
import type { CareerOverview, OpportunityStatus } from "@/lib/career-types";

const statusLabels: Record<OpportunityStatus, string> = {
  discovered: "Discovered",
  shortlisted: "Shortlisted",
  preparing: "Preparing",
  ready_for_review: "Review",
  approved: "Approved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  closed: "Closed",
  skipped: "Skipped",
};

function metricCount(overview: CareerOverview, statuses: OpportunityStatus[]) {
  return overview.opportunities.filter((item) => statuses.includes(item.status))
    .length;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CareerDashboard({ overview }: { overview: CareerOverview }) {
  const companyById = new Map(
    overview.companies.map((item) => [item.id, item]),
  );
  const applicationByOpportunity = new Map(
    overview.applications.map((item) => [item.opportunity_id, item]),
  );
  const contactById = new Map(overview.contacts.map((item) => [item.id, item]));
  const opportunityById = new Map(
    overview.opportunities.map((item) => [item.id, item]),
  );
  const metrics = [
    {
      label: "Planned",
      value: metricCount(overview, ["shortlisted", "preparing"]),
      icon: SearchCheck,
    },
    {
      label: "Needs approval",
      value: metricCount(overview, ["ready_for_review"]),
      icon: Sparkles,
    },
    {
      label: "Applied",
      value: overview.applications.length,
      icon: Send,
    },
    {
      label: "Replies",
      value:
        overview.applications.filter((item) => item.reply_received_at).length +
        overview.outreach.filter((item) => item.status === "replied").length,
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Career pipeline
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One queue for Wellfound, LinkedIn, career pages, applications, and
          referral outreach.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-semibold">{value}</p>
              </div>
              <Icon className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Ranked opportunities and their latest submission status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company / role</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Fit</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Last check</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.opportunities.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No opportunities recorded yet. The discovery run will
                    populate this queue.
                  </TableCell>
                </TableRow>
              ) : (
                overview.opportunities.map((opportunity) => {
                  const company = companyById.get(opportunity.company_id);
                  const application = applicationByOpportunity.get(
                    opportunity.id,
                  );
                  return (
                    <TableRow key={opportunity.id}>
                      <TableCell>
                        <div className="font-medium">{opportunity.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {company?.name ?? "Unknown company"}
                          {opportunity.location_text
                            ? ` · ${opportunity.location_text}`
                            : ""}
                        </div>
                        {opportunity.fit_summary ? (
                          <div className="mt-1 max-w-xl truncate text-xs text-muted-foreground">
                            {opportunity.fit_summary}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="capitalize">
                        {opportunity.source.replace("_", " ")}
                      </TableCell>
                      <TableCell>{opportunity.fit_score ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={application ? "default" : "secondary"}>
                          {application?.status.replace("_", " ") ??
                            statusLabels[opportunity.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(
                          application?.last_checked_at ??
                            opportunity.last_seen_at,
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={opportunity.apply_url ?? opportunity.source_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${opportunity.title}`}
                          className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referral outreach</CardTitle>
            <CardDescription>
              Drafted, sent, and replied messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.outreach.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No outreach recorded yet.
              </p>
            ) : (
              overview.outreach.slice(0, 8).map((item) => {
                const contact = contactById.get(item.contact_id);
                const opportunity = item.opportunity_id
                  ? opportunityById.get(item.opportunity_id)
                  : null;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      {contact ? (
                        <a
                          href={contact.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {contact.full_name}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-medium">
                          Unknown contact
                        </p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        {contact?.title ??
                          opportunity?.title ??
                          "Company contact"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.status === "replied" ? "default" : "secondary"
                      }
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation health</CardTitle>
            <CardDescription>
              Recent discovery and status-sync runs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No automation runs recorded yet.
              </p>
            ) : (
              overview.runs.slice(0, 8).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {run.kind.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(run.started_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      run.status === "failed" ? "destructive" : "secondary"
                    }
                  >
                    {run.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
