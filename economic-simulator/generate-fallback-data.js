#!/usr/bin/env node

/**
 * Generate fallback data for the Armey Curve visualization
 * Fetches real data from World Bank API and creates static fallback
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Country classifications (matching the main application)
const developedCountries = [
  'USA', 'DEU', 'FRA', 'GBR', 'JPN', 'CAN', 'AUS', 'CHE',
  'NLD', 'SWE', 'NOR', 'DNK', 'KOR', 'SGP', 'FIN', 'AUT', 'BEL', 'IRL', 'POL'
];

const developingCountries = [
  'CHN', 'IND', 'VNM', 'BGD', 'ETH', 'RWA', 'IDN', 'PHL',
  'BRA', 'MEX', 'TUR', 'CHL', 'ZAF', 'ARG', 'VEN', 'THA', 'MYS', 'EGY'
];

/**
 * Fetch data from World Bank API
 */
function fetchWorldBankData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });

    }).on('error', (error) => {
      reject(new Error(`HTTP request failed: ${error.message}`));
    });
  });
}

/**
 * Process raw World Bank data into usable format
 */
function processWorldBankData(spendingRaw, growthRaw, dateRange = { start: 2018, end: 2023, label: '2018-2023' }) {
  const countryAverages = {};

  // Calculate averages for spending data
  if (spendingRaw) {
    spendingRaw.forEach(item => {
      if (item.value !== null && item.date >= dateRange.start && item.date <= dateRange.end) {
        const countryCode = item.countryiso3code;
        if (!countryAverages[countryCode]) {
          countryAverages[countryCode] = {
            name: item.country.value,
            spending: [],
            growth: []
          };
        }
        countryAverages[countryCode].spending.push(item.value);
      }
    });
  }

  // Calculate averages for growth data
  if (growthRaw) {
    growthRaw.forEach(item => {
      if (item.value !== null && item.date >= dateRange.start && item.date <= dateRange.end) {
        const countryCode = item.countryiso3code;
        if (countryAverages[countryCode]) {
          countryAverages[countryCode].growth.push(item.value);
        }
      }
    });
  }

  // Calculate final averages and categorize
  const developed = [];
  const developing = [];

  Object.entries(countryAverages).forEach(([code, data]) => {
    // Require at least 3 years of data for reliable average
    if (data.spending.length >= 3 && data.growth.length >= 3) {
      const avgSpending = data.spending.reduce((a, b) => a + b) / data.spending.length;
      const avgGrowth = data.growth.reduce((a, b) => a + b) / data.growth.length;

      const countryInfo = {
        name: data.name,
        spending: Math.round(avgSpending * 10) / 10,
        growth: Math.round(avgGrowth * 10) / 10,
        year: dateRange.label,
        dataPoints: data.spending.length
      };

      if (developedCountries.includes(code)) {
        developed.push(countryInfo);
      } else if (developingCountries.includes(code)) {
        developing.push(countryInfo);
      }
    }
  });

  // Sort by country name for consistent output
  developed.sort((a, b) => a.name.localeCompare(b.name));
  developing.sort((a, b) => a.name.localeCompare(b.name));

  return { developed, developing };
}

/**
 * Generate JavaScript code for fallback data
 */
function generateFallbackCode(processedData, dateRange) {
  return `      function getFallbackData() {
        // Generated fallback data from World Bank API on ${new Date().toISOString()}
        // Data period: ${dateRange.label}
        // Countries with at least 3 years of data
        return {
          developed: ${JSON.stringify(processedData.developed, null, 12).replace(/^/gm, '          ')},
          developing: ${JSON.stringify(processedData.developing, null, 12).replace(/^/gm, '          ')}
        };
      }`;
}

/**
 * Generate JavaScript code for multi-period fallback data
 */
function generateMultiPeriodFallbackCode(allPeriodData, timePeriods) {
  const formattedData = {};
  Object.keys(allPeriodData).forEach(key => {
    formattedData[key] = allPeriodData[key];
  });

  return `      function getFallbackData() {
        // Generated multi-period fallback data from World Bank API on ${new Date().toISOString()}
        // Contains data for all time periods: ${timePeriods.map(p => p.label).join(', ')}
        // Countries included only if they have at least 3 years of data in each period
        const allPeriodData = ${JSON.stringify(formattedData, null, 10).replace(/^/gm, '        ')};
        
        // Return data for the current time period, defaulting to 'recent' if not found
        const timePeriod = document.getElementById("time-period-select")?.value || 'recent';
        return allPeriodData[timePeriod] || allPeriodData.recent;
      }`;
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Fetching World Bank data...');

    const allCountries = [...developedCountries, ...developingCountries];
    const countryString = allCountries.join(';');

    // Define all time periods
    const timePeriods = [
      { key: 'recent', start: 2018, end: 2023, label: '2018-2023 (Recent)' },
      { key: 'decade', start: 2014, end: 2023, label: '2014-2023 (Decade)' },
      { key: 'long', start: 2010, end: 2023, label: '2010-2023 (Long-term)' },
      { key: 'structural', start: 2005, end: 2023, label: '2005-2023 (Structural)' }
    ];

    // Fetch spending data
    const spendingUrl = `https://api.worldbank.org/v2/country/${countryString}/indicator/GC.XPN.TOTL.GD.ZS?date=2005:2023&format=json&per_page=1000`;
    console.log('📊 Fetching government spending data...');
    const spendingData = await fetchWorldBankData(spendingUrl);

    // Fetch growth data  
    const growthUrl = `https://api.worldbank.org/v2/country/${countryString}/indicator/NY.GDP.MKTP.KD.ZG?date=2005:2023&format=json&per_page=1000`;
    console.log('📈 Fetching GDP growth data...');
    const growthData = await fetchWorldBankData(growthUrl);

    // Process data for all time periods
    console.log('⚙️  Processing data for all time periods...');
    const allPeriodData = {};

    timePeriods.forEach(period => {
      console.log(`   Processing ${period.label}...`);
      allPeriodData[period.key] = processWorldBankData(spendingData[1], growthData[1], period);
    });

    // Generate fallback code with all periods
    const fallbackCode = generateMultiPeriodFallbackCode(allPeriodData, timePeriods);

    // Write to file
    const outputPath = path.join(__dirname, 'fallback-data.js');
    fs.writeFileSync(outputPath, fallbackCode);

    // Also save as JSON for inspection
    const jsonPath = path.join(__dirname, 'fallback-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allPeriodData, null, 2));

    console.log('✅ Generated multi-period fallback data successfully!');
    console.log(`📁 JavaScript code: ${outputPath}`);
    console.log(`📋 JSON data: ${jsonPath}`);

    // Show statistics for each period
    timePeriods.forEach(period => {
      const data = allPeriodData[period.key];
      console.log(`📊 ${period.label}: ${data.developed.length} developed + ${data.developing.length} developing countries`);
    });

    console.log('\n💡 To update the fallback data in armey-curve.html:');
    console.log('   1. Copy the generated function from fallback-data.js');
    console.log('   2. Replace the existing getFallbackData() function');

  } catch (error) {
    console.error('❌ Error generating fallback data:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processWorldBankData, generateFallbackCode, generateMultiPeriodFallbackCode };
