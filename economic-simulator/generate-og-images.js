/**
 * Screenshot generator for Open Graph images
 * Captures individual navigation cards as OG preview images
 * 
 * Usage: node generate-og-images.js
 * Requires: puppeteer (npm install puppeteer)
 */

const puppeteer = require('puppeteer');
const path = require('path');

const cards = [
  {
    id: 'navArmeyChart',
    filename: 'armey-curve-preview.png',
    title: 'Armey Curve',
    description: 'Government spending vs economic growth',
    color: '#007bff'
  },
  {
    id: 'navLafferChart',
    filename: 'laffer-curve-preview.png',
    title: 'Laffer Curve',
    description: 'Tax rates vs consent to taxation',
    color: '#28a745'
  },
  {
    id: 'navJChart',
    filename: 'j-curve-preview.png',
    title: 'J-Curve',
    description: 'Economic recovery after policy shocks',
    color: '#dc3545'
  },
  {
    id: 'navSupplyDemandChart',
    filename: 'supply-demand-preview.png',
    title: 'Supply & Demand',
    description: 'Market equilibrium and price discovery',
    color: '#6f42c1'
  },
  {
    id: 'navDivisionChart',
    filename: 'division-of-labor-preview.png',
    title: 'Division of Labor',
    description: "Adam Smith's Pin Factory & specialization",
    color: '#17a2b8'
  },
  {
    id: 'navHockeyChart',
    filename: 'hockey-stick-preview.png',
    title: 'Hockey Stick',
    description: "Capitalism's prosperity explosion",
    color: '#e83e8c'
  }
];

async function generateOGImages() {
  console.log('🎨 Starting Open Graph image generation...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1200, height: 630 } // OG image standard size
  });

  try {
    const page = await browser.newPage();

    // Load the main page
    const indexPath = path.resolve(__dirname, 'index.html');
    await page.goto(`file://${indexPath}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for Chart.js to load
    await page.waitForFunction(
      () => typeof Chart !== 'undefined',
      { timeout: 15000 }
    );

    // Wait for page load event which triggers chart creation
    await page.waitForFunction(
      () => document.readyState === 'complete',
      { timeout: 10000 }
    );

    // Wait for charts to be created (they're created on window load)
    await page.waitForFunction(() => {
      const canvases = ['navArmeyChart', 'navLafferChart', 'navJChart', 'navSupplyDemandChart', 'navDivisionChart', 'navHockeyChart'];
      return canvases.every(id => {
        const canvas = document.getElementById(id);
        if (!canvas) return false;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Check if canvas has any non-transparent pixels
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) return true;
        }
        return false;
      });
    }, { timeout: 20000 });

    console.log('📊 Charts have been rendered successfully');

    for (const card of cards) {
      console.log(`📸 Capturing ${card.title}...`);

      try {
        // Create a styled OG image with the card
        await page.evaluate((cardData) => {
          // Remove any existing OG container
          const existing = document.getElementById('og-container');
          if (existing) existing.remove();

          // Create OG image container
          const ogContainer = document.createElement('div');
          ogContainer.id = 'og-container';
          ogContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 1200px;
            height: 630px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 60px;
            box-sizing: border-box;
          `;

          // Add main title
          const mainTitle = document.createElement('h1');
          mainTitle.style.cssText = `
            font-size: 56px;
            margin: 0 0 20px 0;
            font-weight: 300;
            color: white;
            text-shadow: 0 4px 20px rgba(0,0,0,0.3);
            text-align: center;
            line-height: 1.1;
          `;
          mainTitle.textContent = cardData.title;

          // Add description
          const description = document.createElement('p');
          description.style.cssText = `
            font-size: 28px;
            margin: 0 0 40px 0;
            color: rgba(255,255,255,0.9);
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
            text-align: center;
            line-height: 1.3;
            max-width: 800px;
          `;
          description.textContent = cardData.description;

          // Create chart area
          const chartArea = document.createElement('div');
          chartArea.style.cssText = `
            width: 400px;
            height: 200px;
            background: rgba(255,255,255,0.15);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          `;

          // Try to capture the chart data
          const originalCanvas = document.querySelector(`#${cardData.id}`);
          console.log('Found canvas:', originalCanvas ? 'YES' : 'NO', cardData.id);

          if (originalCanvas) {
            // Method 1: Clone canvas with data
            const newCanvas = document.createElement('canvas');
            newCanvas.width = originalCanvas.width;
            newCanvas.height = originalCanvas.height;
            newCanvas.style.cssText = 'width: 100%; height: 100%; opacity: 0.9;';

            const newCtx = newCanvas.getContext('2d');
            const originalCtx = originalCanvas.getContext('2d');

            // Copy the image data
            try {
              newCtx.drawImage(originalCanvas, 0, 0);
              chartArea.appendChild(newCanvas);
              console.log('Canvas cloned successfully');
            } catch (error) {
              console.log('Canvas clone failed:', error.message);

              // Fallback: Create SVG curve
              const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              svg.setAttribute('width', '100%');
              svg.setAttribute('height', '100%');
              svg.style.cssText = 'opacity: 0.8;';

              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              let pathData = 'M50,150 Q200,50 350,150'; // default curve

              if (cardData.id.includes('Armey')) pathData = 'M50,150 Q200,50 350,150'; // inverted U
              if (cardData.id.includes('Laffer')) pathData = 'M50,150 Q200,50 350,150'; // inverted U
              if (cardData.id.includes('J')) pathData = 'M50,150 Q150,180 350,50'; // J shape
              if (cardData.id.includes('SupplyDemand')) pathData = 'M50,50 L350,150 M50,150 L350,50'; // crossing lines
              if (cardData.id.includes('Division')) pathData = 'M50,150 Q150,100 250,80 Q300,70 350,50'; // exponential
              if (cardData.id.includes('Hockey')) pathData = 'M50,150 L250,150 Q270,150 350,50'; // hockey stick

              path.setAttribute('d', pathData);
              path.setAttribute('stroke', cardData.color);
              path.setAttribute('stroke-width', '4');
              path.setAttribute('fill', 'none');
              svg.appendChild(path);
              chartArea.appendChild(svg);
              console.log('SVG fallback created');
            }
          } else {
            console.log('Canvas not found, using SVG fallback');
            // Create SVG curve as fallback
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.style.cssText = 'opacity: 0.8;';

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let pathData = 'M50,150 Q200,50 350,150'; // default curve

            if (cardData.title.includes('Armey')) pathData = 'M50,150 Q200,50 350,150'; // inverted U
            if (cardData.title.includes('Laffer')) pathData = 'M50,150 Q200,50 350,150'; // inverted U  
            if (cardData.title.includes('J-Curve')) pathData = 'M50,150 Q150,180 350,50'; // J shape
            if (cardData.title.includes('Supply')) pathData = 'M50,50 L350,150 M50,150 L350,50'; // crossing lines
            if (cardData.title.includes('Division')) pathData = 'M50,150 Q150,100 250,80 Q300,70 350,50'; // exponential
            if (cardData.title.includes('Hockey')) pathData = 'M50,150 L250,150 Q270,150 350,50'; // hockey stick

            path.setAttribute('d', pathData);
            path.setAttribute('stroke', cardData.color);
            path.setAttribute('stroke-width', '4');
            path.setAttribute('fill', 'none');
            svg.appendChild(path);
            chartArea.appendChild(svg);
          }

          // Add branding
          const branding = document.createElement('div');
          branding.style.cssText = `
            color: rgba(255,255,255,0.8);
            font-size: 20px;
            text-shadow: 0 2px 8px rgba(0,0,0,0.2);
            text-align: center;
            font-weight: 500;
          `;
          branding.textContent = 'Economic Curves Simulator';

          ogContainer.appendChild(mainTitle);
          ogContainer.appendChild(description);
          ogContainer.appendChild(chartArea);
          ogContainer.appendChild(branding);

          document.body.appendChild(ogContainer);
        }, card);

        // Take screenshot of the OG container
        const ogElement = await page.$('#og-container');
        if (ogElement) {
          await ogElement.screenshot({
            path: path.join(__dirname, card.filename),
            type: 'png'
          });
          console.log(`✅ Generated ${card.filename}`);
        } else {
          console.log(`❌ Could not find OG container for ${card.title}`);
        }

        // Remove the OG container
        await page.evaluate(() => {
          const container = document.getElementById('og-container');
          if (container) container.remove();
        });

      } catch (error) {
        console.error(`❌ Error generating ${card.title}:`, error.message);
      }
    }

    console.log('🎉 All Open Graph images generated successfully!');

  } catch (error) {
    console.error('❌ Error generating images:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Alternative method using HTML Canvas if Puppeteer isn't available
async function generateCanvasOGImages() {
  console.log('🎨 Generating OG images using Canvas method...');

  // This would require running in a browser context
  const script = `
    // This script can be run in the browser console on the index page
    cards.forEach(async (card, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);
      
      // Add text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText(card.title, 600, 200);
      
      ctx.font = '24px Arial';
      ctx.fillText(card.description, 600, 250);
      
      ctx.font = '18px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Economic Curves Simulator', 600, 550);
      
      // Download the image
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = card.filename;
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  `;

  console.log('Canvas generation script ready. Run this in browser console:');
  console.log(script);
}

if (require.main === module) {
  generateOGImages().catch(console.error);
}

module.exports = { generateOGImages, generateCanvasOGImages };
