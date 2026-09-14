"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
} from "react-simple-maps";
import type { ComponentProps } from "react";
import world from "world-atlas/countries-110m.json";

import {
  formatBytes,
  formatCompactNumber,
  type CountryTraffic,
} from "@/lib/analytics/cloudflare-traffic";

import styles from "./analytics-panels.module.css";

const worldTopology = world as unknown as ComponentProps<
  typeof Geographies
>["geography"];

function intensity(requests: number, maximum: number): number {
  if (maximum <= 1) return 0.8;
  return 0.14 + (Math.log1p(requests) / Math.log1p(maximum)) * 0.86;
}

export function GeographyPanel({ countries }: { countries: CountryTraffic[] }) {
  const byNumericCode = new Map(
    countries
      .filter((country) => country.numericCode)
      .map((country) => [country.numericCode, country]),
  );
  const maximum = countries[0]?.requests ?? 1;
  const topCountries = countries.slice(0, 8);

  return (
    <section className={styles.section} aria-labelledby="geography-heading">
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.kicker}>Where requests arrive from</span>
          <h2 id="geography-heading">Global reach</h2>
        </div>
        <p>
          Country-level request totals at Cloudflare&apos;s edge. Darker regions
          handled more traffic; very low-volume regions are withheld.
        </p>
      </div>

      <div className={styles.mapLayout}>
        <div className={styles.mapFrame}>
          <ComposableMap
            aria-label="World map shaded by request volume"
            projection="geoNaturalEarth1"
            projectionConfig={{ scale: 148 }}
            role="img"
          >
            <Sphere
              fill="var(--paper-bright)"
              stroke="var(--ink)"
              strokeWidth={0.35}
            />
            <Geographies geography={worldTopology}>
              {({ geographies }) =>
                geographies.map((geography) => {
                  const country = byNumericCode.get(String(geography.id));
                  return (
                    <Geography
                      key={geography.rsmKey}
                      className={styles.mapCountry}
                      geography={geography}
                      fill={country ? "var(--signal)" : "var(--map-empty)"}
                      fillOpacity={
                        country ? intensity(country.requests, maximum) : 1
                      }
                      stroke="var(--paper-bright)"
                      strokeWidth={0.45}
                    >
                      <title>
                        {country
                          ? `${country.name}: ${formatCompactNumber(country.requests)} ${country.requests === 1 ? "request" : "requests"}`
                          : "No recorded requests"}
                      </title>
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
          <div className={styles.mapLegend} aria-hidden="true">
            <span>Fewer</span>
            <i />
            <i />
            <i />
            <i />
            <span>More requests</span>
          </div>
        </div>

        <ol
          className={styles.countryList}
          aria-label="Top countries by requests"
        >
          {topCountries.map((country, index) => (
            <li key={country.code}>
              <span className={styles.countryRank}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.countryName}>{country.name}</span>
              <span className={styles.countryMetric}>
                <strong>{formatCompactNumber(country.requests)}</strong>
                <small>{formatBytes(country.bytes)}</small>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
