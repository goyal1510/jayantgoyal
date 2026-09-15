const WEB_VITAL_FIELDS = `
  quantiles {
    largestContentfulPaintP75
    interactionToNextPaintP75
    cumulativeLayoutShiftP75
    firstContentfulPaintP75
    timeToFirstByteP75
  }
`;

const WEB_VITAL_SUM_FIELDS = `
  sum {
    visits
    clsGood clsNeedsImprovement clsPoor clsTotal
    fcpGood fcpNeedsImprovement fcpPoor fcpTotal
    inpGood inpNeedsImprovement inpPoor inpTotal
    lcpGood lcpNeedsImprovement lcpPoor lcpTotal
    ttfbGood ttfbNeedsImprovement ttfbPoor ttfbTotal
  }
`;

const COUNTRY_FIELDS = `
  dimensions { countryName }
  ${WEB_VITAL_FIELDS}
  sum { visits }
`;

export const HOURLY_RUM_QUERY = `
  query WebVitals($accountTag: string, $siteTag: string, $host: string, $start: Time, $end: Time) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        series: rumWebVitalsEventsAdaptiveGroups(
          limit: 48
          orderBy: [datetimeHour_ASC]
          filter: { siteTag: $siteTag, requestHost: $host, datetime_geq: $start, datetime_lt: $end }
        ) {
          dimensions { datetimeHour }
          ${WEB_VITAL_FIELDS}
        }
        totals: rumWebVitalsEventsAdaptiveGroups(
          limit: 1
          filter: { siteTag: $siteTag, requestHost: $host, datetime_geq: $start, datetime_lt: $end }
        ) { ${WEB_VITAL_FIELDS} }
      }
    }
  }
`;

export const DAILY_RUM_QUERY = `
  query WebVitals($accountTag: string, $siteTag: string, $host: string, $start: Time, $end: Time) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        series: rumWebVitalsEventsAdaptiveGroups(
          limit: 31
          orderBy: [date_ASC]
          filter: { siteTag: $siteTag, requestHost: $host, datetime_geq: $start, datetime_lt: $end }
        ) {
          dimensions { date }
          ${WEB_VITAL_FIELDS}
        }
        totals: rumWebVitalsEventsAdaptiveGroups(
          limit: 1
          filter: { siteTag: $siteTag, requestHost: $host, datetime_geq: $start, datetime_lt: $end }
        ) { ${WEB_VITAL_FIELDS} }
      }
    }
  }
`;

export const RUM_BREAKDOWN_QUERY = `
  query WebVitalBreakdown($accountTag: string, $siteTag: string, $host: string, $start: Time, $end: Time) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        totals: rumWebVitalsEventsAdaptiveGroups(
          limit: 1
          filter: { siteTag: $siteTag, requestHost: $host, datetime_geq: $start, datetime_lt: $end }
        ) { ${WEB_VITAL_SUM_FIELDS} }
        countries: rumWebVitalsEventsAdaptiveGroups(
          limit: 100
          orderBy: [sum_visits_DESC]
          filter: { siteTag: $siteTag, requestHost: $host, datetime_geq: $start, datetime_lt: $end }
        ) { ${COUNTRY_FIELDS} }
      }
    }
  }
`;
