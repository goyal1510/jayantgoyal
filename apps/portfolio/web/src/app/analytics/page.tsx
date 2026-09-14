import type { Metadata } from "next";

import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { getCloudflareTraffic } from "@/lib/analytics/cloudflare-server";
import { parseTrafficRange } from "@/lib/analytics/cloudflare-traffic";
import { getPortfolioShellData } from "@/lib/portfolio/editorial-server";
import { buildPublicPageMetadata } from "@/lib/seo/config";

import styles from "./analytics.module.css";
import { TrafficDashboard } from "./traffic-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Live Site Analytics",
  description:
    "A privacy-conscious view of traffic, requests, caching, and bandwidth for this portfolio.",
  pathname: "/analytics",
});

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { range: requestedRange } = await searchParams;
  const range = parseTrafficRange(requestedRange);
  const [shell, traffic] = await Promise.all([
    getPortfolioShellData(),
    getCloudflareTraffic(range),
  ]);

  return (
    <main className={`editorial-page ${styles.page}`}>
      <EditorialSubpageHeader
        brandLabel={shell.profile.displayName}
        navigation={shell.navigation}
      />

      <section className={`shell ${styles.hero}`}>
        <div>
          <span className={styles.eyebrow}>Public telemetry / Cloudflare</span>
          <h1 id="traffic-heading">The portfolio, in motion.</h1>
        </div>
        <div className={styles.heroNote}>
          <span className={styles.liveIndicator}>Live edge data</span>
          <p>
            A transparent look at how this site moves across the web—visits,
            requests, cache efficiency, and bandwidth.
          </p>
        </div>
      </section>

      {traffic.ok ? (
        <TrafficDashboard snapshot={traffic.snapshot} />
      ) : (
        <section className={`shell ${styles.unavailable}`}>
          <span>Analytics temporarily unavailable</span>
          <h2>The live edge feed could not be loaded.</h2>
          <p>
            Please check back soon. The rest of the portfolio is unaffected.
          </p>
        </section>
      )}
    </main>
  );
}
