/**
 * fetch-imf-weo.mjs
 *
 * Fetches IMF Datamapper data for:
 *   - exp: Government expenditure % GDP (Public Finances in Modern History Database)
 *   - NGDP_RPCH: Real GDP growth % (World Economic Outlook April 2026)
 *
 * Outputs a fallback-data.json with the same schema as the existing file,
 * plus a `latestSpending` and `latestYear` field per country.
 *
 * Usage: node scripts/fetch-imf-weo.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'fallback-data.json');

// --- Country name mapping: IMF label → our canonical name ---
// Needed because some names differ slightly
const NAME_OVERRIDES = {
  'Bahamas, The': 'Bahamas, The',
  'Czech Republic': 'Czechia',
  'Korea, Rep.': 'Korea, Rep.',
  'Korea': 'Korea, Rep.',
  'Macao SAR, China': 'Macao SAR, China',
  'Macao': 'Macao SAR, China',
  'Russian Federation': 'Russian Federation',
  'Russia': 'Russian Federation',
  'Slovak Republic': 'Slovak Republic',
  'Congo, Dem. Rep. of the': 'Congo, Dem. Rep.',
  'Congo, Dem. Rep.': 'Congo, Dem. Rep.',
  "Côte d'Ivoire": "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  'Syrian Arab Republic': 'Syrian Arab Republic',
  'Gambia, The': 'Gambia, The',
  'Lao PDR': 'Lao PDR',
  'Lao P.D.R.': 'Lao PDR',
  'Micronesia, Fed. Sts.': 'Micronesia, Fed. Sts.',
  'Micronesia, Fed. States of': 'Micronesia, Fed. Sts.',
  'São Tomé and Príncipe': 'São Tomé and Príncipe',
  'Sao Tome and Principe': 'São Tomé and Príncipe',
  'West Bank and Gaza': 'West Bank and Gaza',
  'West Bank & Gaza': 'West Bank and Gaza',
  'Kosovo': 'Kosovo',
  'Puerto Rico': 'Puerto Rico',
  'Taiwan Province of China': 'Taiwan, China',
  'Taiwan': 'Taiwan, China',
};

// --- IMF 3-letter codes for our countries ---
// (ISO 3166-1 alpha-3, matching IMF Datamapper codes)
const COUNTRY_CODES = {
  // Developed
  'Australia': 'AUS',
  'Austria': 'AUT',
  'Bahamas, The': 'BHS',
  'Belgium': 'BEL',
  'Bulgaria': 'BGR',
  'Canada': 'CAN',
  'Chile': 'CHL',
  'Costa Rica': 'CRI',
  'Croatia': 'HRV',
  'Cyprus': 'CYP',
  'Czechia': 'CZE',
  'Denmark': 'DNK',
  'Estonia': 'EST',
  'Finland': 'FIN',
  'France': 'FRA',
  'Germany': 'DEU',
  'Greece': 'GRC',
  'Hungary': 'HUN',
  'Iceland': 'ISL',
  'Ireland': 'IRL',
  'Israel': 'ISR',
  'Italy': 'ITA',
  'Japan': 'JPN',
  'Korea, Rep.': 'KOR',
  'Latvia': 'LVA',
  'Lithuania': 'LTU',
  'Luxembourg': 'LUX',
  'Macao SAR, China': 'MAC',
  'Malta': 'MLT',
  'Nauru': 'NRU',
  'Netherlands': 'NLD',
  'New Zealand': 'NZL',
  'Palau': 'PLW',
  'Panama': 'PAN',
  'Poland': 'POL',
  'Portugal': 'PRT',
  'Romania': 'ROU',
  'Russian Federation': 'RUS',
  'San Marino': 'SMR',
  'Singapore': 'SGP',
  'Slovak Republic': 'SVK',
  'Slovenia': 'SVN',
  'Spain': 'ESP',
  'Sweden': 'SWE',
  'Switzerland': 'CHE',
  'United Kingdom': 'GBR',
  'United States': 'USA',
  'Uruguay': 'URY',
  // Developing
  'Albania': 'ALB',
  'Algeria': 'DZA',
  'Angola': 'AGO',
  'Argentina': 'ARG',
  'Armenia': 'ARM',
  'Azerbaijan': 'AZE',
  'Bangladesh': 'BGD',
  'Belarus': 'BLR',
  'Belize': 'BLZ',
  'Bhutan': 'BTN',
  'Bolivia': 'BOL',
  'Bosnia and Herzegovina': 'BIH',
  'Botswana': 'BWA',
  'Brazil': 'BRA',
  'Cabo Verde': 'CPV',
  'Cambodia': 'KHM',
  'China': 'CHN',
  'Colombia': 'COL',
  'Congo, Dem. Rep.': 'COD',
  'Dominican Republic': 'DOM',
  'Ecuador': 'ECU',
  'Egypt, Arab Rep.': 'EGY',
  'El Salvador': 'SLV',
  'Eswatini': 'SWZ',
  'Ethiopia': 'ETH',
  'Fiji': 'FJI',
  'Gambia, The': 'GMB',
  'Georgia': 'GEO',
  'Ghana': 'GHA',
  'Guatemala': 'GTM',
  'Honduras': 'HND',
  'India': 'IND',
  'Indonesia': 'IDN',
  'Jamaica': 'JAM',
  'Jordan': 'JOR',
  'Kazakhstan': 'KAZ',
  'Kenya': 'KEN',
  'Kosovo': 'UVK',
  'Lao PDR': 'LAO',
  'Lebanon': 'LBN',
  'Lesotho': 'LSO',
  'Madagascar': 'MDG',
  'Malawi': 'MWI',
  'Malaysia': 'MYS',
  'Maldives': 'MDV',
  'Mauritius': 'MUS',
  'Mexico': 'MEX',
  'Micronesia, Fed. Sts.': 'FSM',
  'Moldova': 'MDA',
  'Mongolia': 'MNG',
  'Montenegro': 'MNE',
  'Morocco': 'MAR',
  'Mozambique': 'MOZ',
  'Myanmar': 'MMR',
  'Namibia': 'NAM',
  'Nepal': 'NPL',
  'Nicaragua': 'NIC',
  'North Macedonia': 'MKD',
  'Pakistan': 'PAK',
  'Papua New Guinea': 'PNG',
  'Paraguay': 'PRY',
  'Peru': 'PER',
  'Philippines': 'PHL',
  'Rwanda': 'RWA',
  'Samoa': 'WSM',
  'Senegal': 'SEN',
  'Serbia': 'SRB',
  'Seychelles': 'SYC',
  'Sierra Leone': 'SLE',
  'South Africa': 'ZAF',
  'Sri Lanka': 'LKA',
  'Suriname': 'SUR',
  'Tanzania': 'TZA',
  'Thailand': 'THA',
  'Tonga': 'TON',
  'Tunisia': 'TUN',
  'Turkiye': 'TUR',
  'Turkey': 'TUR',
  'Uganda': 'UGA',
  'Ukraine': 'UKR',
  'Uzbekistan': 'UZB',
  'Vanuatu': 'VUT',
  'Vietnam': 'VNM',
  'West Bank and Gaza': 'WBG',
  'Zambia': 'ZMB',
  'Zimbabwe': 'ZWE',
  // Resource Dependent
  'Bahrain': 'BHR',
  'Brunei Darussalam': 'BRN',
  "Côte d'Ivoire": 'CIV',
  'Equatorial Guinea': 'GNQ',
  'Gabon': 'GAB',
  'Guinea': 'GIN',
  'Iran, Islamic Rep.': 'IRN',
  'Iraq': 'IRQ',
  'Kuwait': 'KWT',
  'Libya': 'LBY',
  'Nigeria': 'NGA',
  'Oman': 'OMN',
  'Qatar': 'QAT',
  'Saudi Arabia': 'SAU',
  'Timor-Leste': 'TLS',
  'Trinidad and Tobago': 'TTO',
  'Turkmenistan': 'TKM',
  'United Arab Emirates': 'ARE',
  'Venezuela, RB': 'VEN',
  'Yemen, Rep.': 'YEM',
  // Externally Funded
  'Afghanistan': 'AFG',
  'Haiti': 'HTI',
  'Liberia': 'LBR',
  'Solomon Islands': 'SLB',
};

// --- Classification metadata from existing fallback-data.json ---
// group: developed | developing | resourceDependent | externallyFunded
// These match the current fallback-data.json
const COUNTRY_META = {
  'Australia': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Austria': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Bahamas, The': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Belgium': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Bulgaria': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Canada': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Chile': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Costa Rica': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Croatia': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Cyprus': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Czechia': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Denmark': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Estonia': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Finland': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'France': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Germany': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Greece': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Hungary': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Iceland': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Ireland': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Israel': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Italy': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Japan': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Korea, Rep.': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Latvia': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Lithuania': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Luxembourg': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Macao SAR, China': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Malta': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Nauru': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Netherlands': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'New Zealand': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Palau': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Panama': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Poland': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Portugal': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Romania': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Russian Federation': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'San Marino': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Singapore': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Slovak Republic': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Slovenia': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Spain': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Sweden': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Switzerland': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'United Kingdom': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'United States': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Uruguay': { group: 'developed', resourceDependent: false, externallyFunded: false },
  'Albania': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Algeria': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Angola': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Argentina': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Armenia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Azerbaijan': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Bangladesh': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Belarus': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Belize': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Bhutan': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Bolivia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Bosnia and Herzegovina': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Botswana': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Brazil': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Cabo Verde': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Cambodia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'China': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Colombia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Congo, Dem. Rep.': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Dominican Republic': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Ecuador': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Egypt, Arab Rep.': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'El Salvador': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Eswatini': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Ethiopia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Fiji': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Gambia, The': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Georgia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Ghana': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Guatemala': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Honduras': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'India': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Indonesia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Jamaica': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Jordan': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Kazakhstan': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Kenya': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Kosovo': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Lao PDR': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Lebanon': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Lesotho': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Madagascar': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Malawi': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Malaysia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Maldives': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Mauritius': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Mexico': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Micronesia, Fed. Sts.': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Moldova': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Mongolia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Montenegro': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Morocco': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Mozambique': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Myanmar': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Namibia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Nepal': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Nicaragua': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'North Macedonia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Pakistan': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Papua New Guinea': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Paraguay': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Peru': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Philippines': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Rwanda': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Samoa': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Senegal': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Serbia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Seychelles': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Sierra Leone': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'South Africa': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Sri Lanka': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Suriname': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Tanzania': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Thailand': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Tonga': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Tunisia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Turkiye': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Uganda': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Ukraine': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Uzbekistan': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Vanuatu': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Vietnam': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'West Bank and Gaza': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Zambia': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Zimbabwe': { group: 'developing', resourceDependent: false, externallyFunded: false },
  'Bahrain': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Brunei Darussalam': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  "Côte d'Ivoire": { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Equatorial Guinea': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Gabon': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Guinea': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Iran, Islamic Rep.': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Iraq': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Kuwait': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Libya': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Nigeria': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Oman': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Qatar': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Saudi Arabia': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Timor-Leste': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Trinidad and Tobago': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Turkmenistan': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'United Arab Emirates': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Venezuela, RB': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Yemen, Rep.': { group: 'resourceDependent', resourceDependent: true, externallyFunded: false },
  'Afghanistan': { group: 'externallyFunded', resourceDependent: false, externallyFunded: true },
  'Haiti': { group: 'externallyFunded', resourceDependent: false, externallyFunded: true },
  'Liberia': { group: 'externallyFunded', resourceDependent: false, externallyFunded: true },
  'Solomon Islands': { group: 'externallyFunded', resourceDependent: false, externallyFunded: true },
};

// Period definitions: [startYear, endYear, label]
const PERIODS = {
  recent:     [2019, 2024, 'Recent (2019-2024)'],
  decade:     [2014, 2024, 'Decade (2014-2024)'],
  long:       [2004, 2024, 'Long (2004-2024)'],
  structural: [1994, 2024, 'Structural (1994-2024)'],
};

// Only use years up through 2024 (latest actuals in IMF exp database)
const MAX_SPENDING_YEAR = 2024;
// For GDP growth, include forecasts up to 2024 for period averages, but use only actuals for display
const MAX_GROWTH_YEAR = 2024;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  console.log('Fetching IMF expenditure data (exp)...');
  const expData = await fetchJSON('https://www.imf.org/external/datamapper/api/v1/exp');
  const expByCountry = expData.values?.exp ?? {};

  console.log('Fetching IMF GDP growth data (NGDP_RPCH)...');
  const gdpData = await fetchJSON('https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH');
  const gdpByCountry = gdpData.values?.NGDP_RPCH ?? {};

  const output = {};

  for (const [periodKey, [startYear, endYear, periodLabel]] of Object.entries(PERIODS)) {
    output[periodKey] = {
      developed: [],
      developing: [],
      resourceDependent: [],
      externallyFunded: [],
    };

    for (const [countryName, meta] of Object.entries(COUNTRY_META)) {
      const code = COUNTRY_CODES[countryName];
      if (!code) {
        console.warn(`No code for ${countryName}, skipping`);
        continue;
      }

      const expYears = expByCountry[code] ?? {};
      const gdpYears = gdpByCountry[code] ?? {};

      // Compute period average spending
      const spendVals = [];
      for (let y = startYear; y <= Math.min(endYear, MAX_SPENDING_YEAR); y++) {
        const v = expYears[String(y)];
        if (v !== undefined && v !== null) spendVals.push(v);
      }

      // Compute period average GDP growth (use actuals only up to MAX_GROWTH_YEAR)
      const growthVals = [];
      for (let y = startYear; y <= Math.min(endYear, MAX_GROWTH_YEAR); y++) {
        const v = gdpYears[String(y)];
        if (v !== undefined && v !== null) growthVals.push(v);
      }

      if (spendVals.length === 0 && growthVals.length === 0) {
        console.warn(`No data for ${countryName} (${code}) in ${periodKey}, skipping`);
        continue;
      }

      const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      const round1 = (x) => x !== null ? Math.round(x * 10) / 10 : null;

      const spending = round1(avg(spendVals));
      const growth = round1(avg(growthVals));

      // Latest spending: most recent year with data, up to MAX_SPENDING_YEAR
      let latestSpending = null;
      let latestYear = null;
      for (let y = MAX_SPENDING_YEAR; y >= 1990; y--) {
        const v = expYears[String(y)];
        if (v !== undefined && v !== null) {
          latestSpending = round1(v);
          latestYear = y;
          break;
        }
      }

      const entry = {
        name: countryName,
        spending,
        growth,
        year: `${startYear}-${Math.min(endYear, MAX_SPENDING_YEAR)} (${periodLabel.split(' (')[0]})`,
        dataPoints: spendVals.length,
        resourceDependent: meta.resourceDependent,
        externallyFunded: meta.externallyFunded,
        latestSpending,
        latestYear,
      };

      output[periodKey][meta.group].push(entry);
    }

    // Sort by name within each group
    for (const grp of Object.keys(output[periodKey])) {
      output[periodKey][grp].sort((a, b) => a.name.localeCompare(b.name));
    }

    const totalCountries = Object.values(output[periodKey]).reduce((s, a) => s + a.length, 0);
    console.log(`Period ${periodKey}: ${totalCountries} countries`);
  }

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`Written to ${OUTPUT}`);

  // Print a quick summary for France
  const fra = output.recent.developed.find(c => c.name === 'France');
  if (fra) {
    console.log(`\nFrance (recent): spending=${fra.spending}, growth=${fra.growth}, latestSpending=${fra.latestSpending} (${fra.latestYear})`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
