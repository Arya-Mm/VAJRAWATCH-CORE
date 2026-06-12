const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5175/';
const OUT_DIR = 'C:\\Users\\jagua\\.gemini\\antigravity\\brain\\2def5e00-9a34-46ca-9255-35482a0bf4d4';

async function runTest() {
  console.log('Starting automated runtime verification test...');
  console.log('Target URL:', APP_URL);
  console.log('Chrome Path:', CHROME_PATH);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--use-gl=angle',
      '--use-angle=swiftshader'
    ]
  });

  const page = await browser.newPage();
  
  // Set viewport to a stable large size
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    // Filter out standard hot reload/Vite logs to keep output clean
    if (!text.includes('[vite]') && !text.includes('HMR')) {
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
      console.log(`[Browser Console] [${msg.type().toUpperCase()}] ${text}`);
    }
  });

  // Navigate to local dashboard
  await page.goto(APP_URL, { waitUntil: 'networkidle2' });
  console.log('App loaded successfully.');

  // Wait a short bit for map/3D canvas setup
  await new Promise(r => setTimeout(r, 2000));

  // Capture memory before
  const memBefore = await page.evaluate(() => {
    return window.performance.memory ? {
      usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)) + ' MB',
      totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024)) + ' MB'
    } : 'window.performance.memory not supported';
  });
  console.log('JS Heap Memory (Before):', memBefore);

  // Take screenshot before test
  const beforeScreenshotPath = path.join(OUT_DIR, 'before_test.png');
  await page.screenshot({ path: beforeScreenshotPath });
  console.log('Saved before_test.png to', beforeScreenshotPath);

  // Verify elements exist
  const modesToggleExists = await page.evaluate(() => !!document.querySelector('.map-modes-toggle'));
  console.log('Modes toggle bar found in DOM:', modesToggleExists);

  // 1. Perform 50 rapid mode switches (2D -> 3D -> Simulation)
  console.log('Starting 50 rapid mode switches...');
  const modeButtons = await page.$$('.map-modes-toggle button');
  if (modeButtons.length >= 3) {
    for (let i = 0; i < 50; i++) {
      const idx = i % 3;
      await modeButtons[idx].click();
      await new Promise(r => setTimeout(r, 100)); // 100ms rapid delay
    }
    console.log('Completed 50 mode switches.');
  } else {
    console.error('Error: Could not find mode buttons in DOM');
  }

  // Go to simulation mode for lake switches to ensure full 3D and sim overlays are loaded
  if (modeButtons.length >= 3) {
    await modeButtons[2].click(); // simulation
    await new Promise(r => setTimeout(r, 1000));
  }

  // 2. Perform 20 lake changes
  console.log('Starting 20 lake changes...');
  const lakeSelectorExists = await page.evaluate(() => !!document.querySelector('.lake-selector-dropdown'));
  if (lakeSelectorExists) {
    const lakeIds = ['PDGL_THULAGI_01', 'PDGL_TSHO_ROLPA_02', 'PDGL_IMJA_03', 'PDGL_LOWER_BARUN_04'];
    for (let i = 0; i < 20; i++) {
      const lakeId = lakeIds[i % lakeIds.length];
      await page.select('.lake-selector-dropdown', lakeId);
      await new Promise(r => setTimeout(r, 150)); // 150ms switch delay
    }
    console.log('Completed 20 lake changes.');
  } else {
    console.error('Error: Could not find lake selector dropdown');
  }

  // Wait for rendering to settle
  await new Promise(r => setTimeout(r, 2000));

  // Capture memory after
  const memAfter = await page.evaluate(() => {
    return window.performance.memory ? {
      usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)) + ' MB',
      totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024)) + ' MB'
    } : 'window.performance.memory not supported';
  });
  console.log('JS Heap Memory (After):', memAfter);

  // Take screenshot after test
  const afterScreenshotPath = path.join(OUT_DIR, 'after_test.png');
  await page.screenshot({ path: afterScreenshotPath });
  console.log('Saved after_test.png to', afterScreenshotPath);

  // Save logs to file for review
  const logFilePath = path.join(OUT_DIR, 'runtime_console_log.json');
  fs.writeFileSync(logFilePath, JSON.stringify({
    memoryBefore: memBefore,
    memoryAfter: memAfter,
    consoleLogs: consoleLogs
  }, null, 2));
  console.log('Saved console logs to', logFilePath);

  await browser.close();
  console.log('Automated runtime verification finished.');
}

runTest().catch(console.error);
