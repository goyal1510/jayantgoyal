export type ContributionPeriod = number | "last";

type ContributionActivity = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type ContributionCalendarData = {
  activities: ContributionActivity[];
  period: ContributionPeriod;
  periodLabel: string;
  totalContributions: number;
};

type ContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

type GraphQLContributionDay = {
  contributionCount: number;
  contributionLevel: ContributionLevel;
  date: string;
};

type GraphQLContributionCalendar = {
  totalContributions: number;
  weeks: Array<{ contributionDays: GraphQLContributionDay[] }>;
};

type GraphQLContributionResponse = {
  data?: {
    user?: {
      contributionsCollection: {
        contributionCalendar: GraphQLContributionCalendar;
      };
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

const CONTRIBUTION_LEVELS: Record<ContributionLevel, 0 | 1 | 2 | 3 | 4> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const CONTRIBUTION_QUERY = `
  query PortfolioContributionCalendar(
    $login: String!
    $from: DateTime!
    $to: DateTime!
  ) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
      }
    }
  }
`;

export function resolveContributionPeriod(
  value: string | null,
  now = new Date(),
) {
  const currentYear = now.getUTCFullYear();

  if (!value || value === "last") {
    return {
      from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      period: "last" as const,
      periodLabel: "in the last year",
      to: now,
    };
  }

  const year = Number(value);
  if (
    !Number.isInteger(year) ||
    year < currentYear - 10 ||
    year > currentYear
  ) {
    return null;
  }

  return {
    from: new Date(Date.UTC(year, 0, 1)),
    period: year,
    periodLabel: `in ${year}`,
    to: new Date(Date.UTC(year + 1, 0, 1) - 1),
  };
}

export function normaliseContributionCalendar(
  calendar: GraphQLContributionCalendar,
  period: ContributionPeriod,
  periodLabel: string,
): ContributionCalendarData {
  return {
    activities: calendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        count: day.contributionCount,
        date: day.date,
        level: CONTRIBUTION_LEVELS[day.contributionLevel],
      })),
    ),
    period,
    periodLabel,
    totalContributions: calendar.totalContributions,
  };
}

export async function fetchGitHubContributionCalendar({
  fetcher = fetch,
  from,
  period,
  periodLabel,
  to,
  token,
  username,
}: {
  fetcher?: typeof fetch;
  from: Date;
  period: ContributionPeriod;
  periodLabel: string;
  to: Date;
  token: string;
  username: string;
}) {
  const response = await fetcher("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      query: CONTRIBUTION_QUERY,
      variables: {
        from: from.toISOString(),
        login: username,
        to: to.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub contribution request failed with ${response.status}`,
    );
  }

  const payload = (await response.json()) as GraphQLContributionResponse;
  const calendar =
    payload.data?.user?.contributionsCollection.contributionCalendar;

  if (!calendar || payload.errors?.length) {
    throw new Error("GitHub contribution data is unavailable");
  }

  return normaliseContributionCalendar(calendar, period, periodLabel);
}
