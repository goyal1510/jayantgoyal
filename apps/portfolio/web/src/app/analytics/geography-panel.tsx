"use client";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
} from "react-simple-maps";
import type { ComponentProps } from "react";
import world from "world-atlas/countries-110m.json";

import {
  getWebVitalRating,
  type CountryWebVitals,
} from "@/lib/analytics/cloudflare-rum";
import {
  formatBytes,
  formatCompactNumber,
  type CountryTraffic,
  type TrafficRange,
} from "@/lib/analytics/cloudflare-traffic";

import styles from "./analytics-panels.module.css";
import detailStyles from "./country-detail.module.css";
import {
  activateCountry,
  COUNTRY_VITALS,
  countryIntensity,
  GEOGRAPHY_RANGE_LABELS,
} from "./geography-config";
import tooltipStyles from "./map-tooltip.module.css";
import sectionStyles from "./analytics-section.module.css";

const worldTopology = world as unknown as ComponentProps<
  typeof Geographies
>["geography"];

export function GeographyPanel({
  countries,
  range,
  totalRequests,
  webVitals,
}: {
  countries: CountryTraffic[];
  range: TrafficRange;
  totalRequests: number;
  webVitals: CountryWebVitals[];
}) {
  const [selectedCode, setSelectedCode] = useState(countries[0]?.code ?? "");
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const selected =
    countries.find((country) => country.code === selectedCode) ?? countries[0];
  const hovered = countries.find((country) => country.code === hoveredCode);
  const maximum = countries[0]?.requests ?? 1;
  const byNumericCode = useMemo(
    () =>
      new Map(
        countries
          .filter((country) => country.numericCode)
          .map((country) => [country.numericCode, country]),
      ),
    [countries],
  );
  const vitalsByCode = useMemo(
    () => new Map(webVitals.map((country) => [country.code, country])),
    [webVitals],
  );
  const selectedVitals = selected ? vitalsByCode.get(selected.code) : undefined;

  return (
    <section
      className={sectionStyles.section}
      aria-labelledby="geography-heading"
    >
      <div className={sectionStyles.sectionHeading}>
        <div>
          <span className={sectionStyles.kicker}>
            Where requests arrive from
          </span>
          <h2 id="geography-heading">Global reach</h2>
        </div>
        <p>
          Hover or focus a country for a quick read. Select it to inspect its
          traffic, bandwidth, security signals, and available field performance.
        </p>
      </div>

      <div className={styles.mapLayout}>
        <div className={styles.mapFrame}>
          <ComposableMap
            aria-label="Interactive world map shaded by request volume"
            projection="geoNaturalEarth1"
            projectionConfig={{ scale: 148 }}
            role="img"
          >
            <Sphere
              fill="var(--paper-bright)"
              stroke="var(--analytics-secondary)"
              strokeWidth={0.35}
            />
            <Geographies geography={worldTopology}>
              {({ geographies }) =>
                geographies.map((geography) => {
                  const country = byNumericCode.get(String(geography.id));
                  const isSelected = country?.code === selected?.code;
                  return (
                    <Geography
                      key={geography.rsmKey}
                      aria-label={
                        country
                          ? `${country.name}, ${formatCompactNumber(country.requests)} requests. Select for details.`
                          : "No published traffic data"
                      }
                      aria-pressed={country ? isSelected : undefined}
                      className={styles.mapCountry}
                      geography={geography}
                      fill={country ? "var(--signal)" : "var(--map-empty)"}
                      fillOpacity={
                        isSelected
                          ? 1
                          : country
                            ? countryIntensity(country.requests, maximum)
                            : 1
                      }
                      onBlur={() => setHoveredCode(null)}
                      onClick={() => country && setSelectedCode(country.code)}
                      onFocus={() => setHoveredCode(country?.code ?? null)}
                      onKeyDown={(event) =>
                        country &&
                        activateCountry(event, country.code, setSelectedCode)
                      }
                      onMouseEnter={() => setHoveredCode(country?.code ?? null)}
                      onMouseLeave={() => setHoveredCode(null)}
                      role={country ? "button" : undefined}
                      stroke={
                        isSelected
                          ? "var(--analytics-secondary)"
                          : "var(--paper-bright)"
                      }
                      strokeWidth={isSelected ? 1.2 : 0.45}
                      tabIndex={country ? 0 : -1}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {hovered ? (
            <div className={tooltipStyles.mapTooltip} role="tooltip">
              <strong>{hovered.name}</strong>
              <span>{formatCompactNumber(hovered.requests)} requests</span>
              <span>{formatBytes(hovered.bytes)} served</span>
              <span>{formatCompactNumber(hovered.threats)} threat signals</span>
              <small>
                {GEOGRAPHY_RANGE_LABELS[range]} · select for details
              </small>
            </div>
          ) : null}

          <div className={styles.mapLegend} aria-hidden="true">
            <span>Fewer</span>
            <i />
            <i />
            <i />
            <i />
            <span>More requests</span>
          </div>
        </div>

        <aside className={styles.countryInspector} aria-live="polite">
          {selected ? (
            <div className={styles.countryInspectorContent} key={selected.code}>
              <div className={styles.countryDetailHeader}>
                <span>Selected country</span>
                <h3>{selected.name}</h3>
                <p>{GEOGRAPHY_RANGE_LABELS[range]}</p>
              </div>
              <dl className={styles.countryFacts}>
                <div>
                  <dt>Requests</dt>
                  <dd>{formatCompactNumber(selected.requests)}</dd>
                </div>
                <div>
                  <dt>Traffic share</dt>
                  <dd>
                    {totalRequests > 0
                      ? `${((selected.requests / totalRequests) * 100).toFixed(1)}%`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Data served</dt>
                  <dd>{formatBytes(selected.bytes)}</dd>
                </div>
                <div>
                  <dt>Average response</dt>
                  <dd>
                    {formatBytes(
                      selected.requests > 0
                        ? selected.bytes / selected.requests
                        : 0,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Threat requests</dt>
                  <dd>{formatCompactNumber(selected.threats)}</dd>
                </div>
                <div>
                  <dt>RUM visits</dt>
                  <dd>
                    {selectedVitals
                      ? formatCompactNumber(selectedVitals.visits)
                      : "Not enough data"}
                  </dd>
                </div>
              </dl>

              {selectedVitals ? (
                <div
                  className={detailStyles.countryVitals}
                  aria-label={`Field performance for ${selected.name}`}
                >
                  {COUNTRY_VITALS.map((vital) => (
                    <div key={vital.key}>
                      <span>{vital.label}</span>
                      <strong>{vital.format(selectedVitals[vital.key])}</strong>
                      <small
                        data-rating={getWebVitalRating(
                          vital.key,
                          selectedVitals[vital.key],
                        )}
                      >
                        {getWebVitalRating(
                          vital.key,
                          selectedVitals[vital.key],
                        ) === "unknown"
                          ? "awaiting data"
                          : getWebVitalRating(
                              vital.key,
                              selectedVitals[vital.key],
                            ).replace("-", " ")}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={detailStyles.countryNoVitals}>
                  Cloudflare has fewer than 10 measured browser visits here, so
                  country-level Web Vitals are withheld.
                </p>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
