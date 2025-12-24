// Shared Navigation for Economic Curves Simulator
// Creates navigation section with chart previews for all pages

function insertNavigation() {
  // Create navigation section HTML
  const navigationHTML = `
    <section style="margin-top: 50px; padding: 30px 0; border-top: 2px solid rgba(255, 255, 255, 0.18);">
      <h2 style="margin-top: 0; margin-bottom: 20px; color: #333; text-align: center;">
        📊 Explore Other Economic Curves
      </h2>
      <p style="text-align: center; margin-bottom: 25px; color: #666; font-style: italic;">
        Navigate between different economic models and their associated natural rights:
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px;">
        <div style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); padding: 20px; border-radius: 1.75rem; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); transition: all 0.3s ease;">
          <a href="armey-curve.html" style="text-decoration: none; color: inherit; display: block;">
            <div style="height: 80px; margin-bottom: 12px; position: relative;">
              <canvas id="navArmeyChart" style="width: 100%; height: 100%;"></canvas>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #007bff; font-size: 16px;">1. Armey Curve</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">Government spending vs economic growth</p>
            <p style="margin: 0; font-size: 13px; color: #666; font-weight: 500;">→ Right to Economic Growth</p>
          </a>
        </div>

        <div style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); padding: 20px; border-radius: 1.75rem; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); transition: all 0.3s ease;">
          <a href="laffer-curve.html" style="text-decoration: none; color: inherit; display: block;">
            <div style="height: 80px; margin-bottom: 12px; position: relative;">
              <canvas id="navLafferChart" style="width: 100%; height: 100%;"></canvas>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #28a745; font-size: 16px;">2. Laffer Curve</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">Tax rates vs consent to taxation</p>
            <p style="margin: 0; font-size: 13px; color: #666; font-weight: 500;">→ Right to Economic Attractiveness</p>
          </a>
        </div>

        <div style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); padding: 20px; border-radius: 1.75rem; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); transition: all 0.3s ease;">
          <a href="j-curve.html" style="text-decoration: none; color: inherit; display: block;">
            <div style="height: 80px; margin-bottom: 12px; position: relative;">
              <canvas id="navJChart" style="width: 100%; height: 100%;"></canvas>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #dc3545; font-size: 16px;">3. J-Curve</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">Economic recovery after policy shocks</p>
            <p style="margin: 0; font-size: 13px; color: #666; font-weight: 500;">→ Right to Economic Recovery</p>
          </a>
        </div>

        <div style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); padding: 20px; border-radius: 1.75rem; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); transition: all 0.3s ease;">
          <a href="supply-demand.html" style="text-decoration: none; color: inherit; display: block;">
            <div style="height: 80px; margin-bottom: 12px; position: relative;">
              <canvas id="navSupplyDemandChart" style="width: 100%; height: 100%;"></canvas>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #6f42c1; font-size: 16px;">4. Supply & Demand</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">Market equilibrium and price discovery</p>
            <p style="margin: 0; font-size: 13px; color: #666; font-weight: 500;">→ Right to Fair Prices</p>
          </a>
        </div>

        <div style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); padding: 20px; border-radius: 1.75rem; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); transition: all 0.3s ease;">
          <a href="division-of-labor.html" style="text-decoration: none; color: inherit; display: block;">
            <div style="height: 80px; margin-bottom: 12px; position: relative;">
              <canvas id="navDivisionChart" style="width: 100%; height: 100%;"></canvas>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #17a2b8; font-size: 16px;">5. Division of Labor</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">Adam Smith's Pin Factory & specialization</p>
            <p style="margin: 0; font-size: 13px; color: #666; font-weight: 500;">→ Right to Productivity</p>
          </a>
        </div>

        <div style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); padding: 20px; border-radius: 1.75rem; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); transition: all 0.3s ease;">
          <a href="hockey-stick.html" style="text-decoration: none; color: inherit; display: block;">
            <div style="height: 80px; margin-bottom: 12px; position: relative;">
              <canvas id="navHockeyChart" style="width: 100%; height: 100%;"></canvas>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #e83e8c; font-size: 16px;">6. Hockey Stick</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">Capitalism's prosperity explosion</p>
            <p style="margin: 0; font-size: 13px; color: #666; font-weight: 500;">→ Right to Prosperity</p>
          </a>
        </div>

        <div style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); padding: 20px; border-radius: 1.75rem; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); transition: all 0.3s ease;">
          <a href="index.html" style="text-decoration: none; color: inherit; display: block;">
            <div style="height: 80px; margin-bottom: 12px; position: relative; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
              <span style="font-size: 24px;">🏠</span>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">🏠 Home</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">Overview of all economic curves</p>
            <p style="margin: 0; font-size: 13px; color: #666; font-weight: 500;">→ Main Dashboard</p>
          </a>
        </div>
      </div>

      <p style="text-align: center; margin-top: 25px; margin-bottom: 0; font-size: 14px; color: #666;">
        💡 Each page includes interactive simulations, historical examples, and institutional frameworks for protecting natural rights.
      </p>
    </section>

    <style>
      /* Navigation cards hover effect */
      div[style*="transition: all"]:hover {
        box-shadow: 0 15px 50px 0 rgba(31, 38, 135, 0.5) !important;
        background: rgba(255, 255, 255, 0.35) !important;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        div[style*="background: rgba(255, 255, 255, 0.25)"] {
          background: rgba(45, 55, 72, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #e0e0e0 !important;
        }
        
        h2, h3 {
          color: #f7fafc !important;
        }
        
        p {
          color: #e2e8f0 !important;
        }

        div[style*="background: rgba(255, 255, 255, 0.25)"]:hover {
          background: rgba(45, 55, 72, 0.35) !important;
        }
      }
    </style>
  `;

  // Insert navigation before closing body tag
  document.body.insertAdjacentHTML('beforeend', navigationHTML);

  // Wait for Chart.js to be available, then create charts
  setTimeout(createNavigationPreviews, 100);
}

function createNavigationPreviews() {
  // Only create charts if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded, navigation charts will not display');
    return;
  }

  // Armey Curve preview
  const navArmeyCtx = document.getElementById("navArmeyChart");
  if (navArmeyCtx) {
    const armeyData = Array.from({ length: 21 }, (_, i) => i * 5);
    const armeyGrowth = armeyData.map((g) => 4.5 + 0.5 * g - 0.01 * g * g);

    new Chart(navArmeyCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: armeyData,
        datasets: [{
          data: armeyGrowth,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  // Laffer Curve preview
  const navLafferCtx = document.getElementById("navLafferChart");
  if (navLafferCtx) {
    const lafferData = Array.from({ length: 21 }, (_, i) => i * 5);
    const lafferRevenue = lafferData.map((t) => 0 + 1 * t - 0.02 * t * t);

    new Chart(navLafferCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: lafferData,
        datasets: [{
          data: lafferRevenue,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  // J-Curve preview
  const navJCtx = document.getElementById("navJChart");
  if (navJCtx) {
    const jData = Array.from({ length: 21 }, (_, i) => i);
    const jValues = jData.map((t) => 0 + 1 * t - 10 * (1 - Math.exp(-t / 2)));

    new Chart(navJCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: jData,
        datasets: [{
          data: jValues,
          borderColor: "#dc3545",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  // Supply & Demand preview
  const navSupplyDemandCtx = document.getElementById("navSupplyDemandChart");
  if (navSupplyDemandCtx) {
    const sdData = Array.from({ length: 21 }, (_, i) => i * 5);
    const demandData = sdData.map((q) => 150 / Math.pow(1 + 0.02 * q, 0.5));
    const supplyData = sdData.map((q) => 10 + 0.5 * Math.pow(q, 1.3));

    new Chart(navSupplyDemandCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: sdData,
        datasets: [
          {
            data: demandData,
            borderColor: "#6f42c1",
            backgroundColor: "rgba(111, 66, 193, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            data: supplyData,
            borderColor: "#6f42c1",
            backgroundColor: "rgba(111, 66, 193, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  // Division of Labor preview
  const navDivisionCtx = document.getElementById("navDivisionChart");
  if (navDivisionCtx) {
    const divisionData = Array.from({ length: 11 }, (_, i) => i + 1);
    const productivityData = divisionData.map((w) => {
      const specializationBoost = 1 + (w - 1) * 4.23;
      return 20 * Math.pow(specializationBoost, 1.5);
    });
    const totalOutputData = divisionData.map((w, i) => productivityData[i] * w);

    new Chart(navDivisionCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: divisionData,
        datasets: [
          {
            data: productivityData,
            borderColor: "#17a2b8",
            backgroundColor: "rgba(23, 162, 184, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            data: totalOutputData,
            borderColor: "#fd7e14",
            backgroundColor: "rgba(253, 126, 20, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
      },
    });
  }

  // Hockey Stick preview
  const navHockeyCtx = document.getElementById("navHockeyChart");
  if (navHockeyCtx) {
    const hockeyYears = [0, 1000, 1700, 1800, 1850, 1900, 1950, 1980, 2000, 2025];
    const hockeyGDP = [600, 605, 620, 680, 1200, 3500, 12000, 28000, 45000, 85000];

    new Chart(navHockeyCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: hockeyYears,
        datasets: [{
          data: hockeyGDP,
          borderColor: "#e83e8c",
          backgroundColor: "rgba(232, 62, 140, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.05,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false, beginAtZero: false, min: 0 } },
      },
    });
  }
}
