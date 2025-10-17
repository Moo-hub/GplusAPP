const mocha = require('mocha');
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_FAIL, EVENT_TEST_PASS } = mocha.Runner.constants;

/**
 * Visual Regression Reporter for Cypress tests
 * Generates visual comparison reports for screenshot-based tests
 */
class GplusVisualRegressionReporter {
  constructor(runner, options) {
    this.options = options || {};
    this.reportDir = path.resolve(this.options.reporterOptions?.reportDir || 'cypress/visual-reports');
    this.baselineDir = path.join(this.reportDir, 'baseline');
    this.currentDir = path.join(this.reportDir, 'current');
    this.diffDir = path.join(this.reportDir, 'diff');
    this.reportFilename = this.options.reporterOptions?.reportFilename || 'visual-report.html';
    
    this.visualTests = [];
    this.screenshotsPath = path.resolve('cypress/screenshots');
    
    // Ensure report directories exist
    this.ensureDirectories();
    
    runner.on(EVENT_RUN_BEGIN, () => {
      // Clean up diff directory at the start of a run
      this.cleanDirectory(this.diffDir);
      
      // Create empty current directory for new screenshots
      this.cleanDirectory(this.currentDir);
    });
    
    runner.on(EVENT_TEST_PASS, (test) => {
      // Check if this test has any screenshots
      this.processTestScreenshots(test);
    });
    
    runner.on(EVENT_TEST_FAIL, (test) => {
      // Check if this test has any screenshots even if it failed
      this.processTestScreenshots(test);
    });
    
    runner.on(EVENT_RUN_END, () => {
      this.generateReport();
    });
  }
  
  ensureDirectories() {
    for (const dir of [this.reportDir, this.baselineDir, this.currentDir, this.diffDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  cleanDirectory(dir) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          // Recursively clean subdirectories
          this.cleanDirectory(filePath);
          fs.rmdirSync(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      }
    } else {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  processTestScreenshots(test) {
    // Skip if no file property or screenshots directory doesn't exist
    if (!test.file || !fs.existsSync(this.screenshotsPath)) return;
    
    // Get test file name without extension
    const testFileName = path.basename(test.file, '.js');
    
    // Check if any screenshots were taken for this test
    const screenshotDir = path.join(this.screenshotsPath, testFileName);
    if (!fs.existsSync(screenshotDir)) return;
    
    // Get all screenshots for this test
    this.processScreenshotsInDirectory(screenshotDir, test);
  }
  
  processScreenshotsInDirectory(dir, test) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Process nested directories (Cypress can create these)
        this.processScreenshotsInDirectory(fullPath, test);
      } else if (entry.isFile() && this.isImageFile(entry.name)) {
        // Process image file
        this.processScreenshot(fullPath, test);
      }
    }
  }
  
  isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg'].includes(ext);
  }
  
  processScreenshot(screenshotPath, test) {
    try {
      // Get relative path within screenshots dir for organized reporting
      const relativePath = path.relative(this.screenshotsPath, screenshotPath);
      
      // Generate a hash of the path to use as a unique identifier
      const screenshotId = this.getScreenshotId(relativePath);
      
      // Copy the current screenshot to the current directory
      const currentPath = path.join(this.currentDir, `${screenshotId}${path.extname(screenshotPath)}`);
      fs.copyFileSync(screenshotPath, currentPath);
      
      // Check if we have a baseline image
      const baselinePath = path.join(this.baselineDir, `${screenshotId}${path.extname(screenshotPath)}`);
      const hasBaseline = fs.existsSync(baselinePath);
      
      // If no baseline exists, copy the current as the baseline
      if (!hasBaseline) {
        fs.copyFileSync(currentPath, baselinePath);
      }
      
      // Track this screenshot for reporting
      this.visualTests.push({
        id: screenshotId,
        testName: test.fullTitle(),
        testPath: test.file,
        screenshotName: path.basename(screenshotPath),
        screenshotPath: relativePath,
        baselineExists: hasBaseline,
        currentPath: path.relative(this.reportDir, currentPath),
        baselinePath: path.relative(this.reportDir, baselinePath),
        // We'll generate diffs in the report, not here
        diffPath: `diff/${screenshotId}${path.extname(screenshotPath)}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(`Error processing screenshot ${screenshotPath}:`, err);
    }
  }
  
  getScreenshotId(relativePath) {
    return createHash('md5').update(relativePath).digest('hex');
  }
  
  generateReport() {
    const reportPath = path.join(this.reportDir, this.reportFilename);
    const reportData = {
      tests: this.visualTests,
      timestamp: new Date().toISOString(),
      totalScreenshots: this.visualTests.length,
      newScreenshots: this.visualTests.filter(t => !t.baselineExists).length
    };
    
    const html = this.renderHtml(reportData);
    fs.writeFileSync(reportPath, html);
    
    console.log(`\nVisual regression report generated at: ${reportPath}\n`);
  }
  
  renderHtml(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>G+ App Visual Regression Test Results</title>
    <script src="https://cdn.jsdelivr.net/npm/pixelmatch@5.2.1/dist/pixelmatch.min.js"></script>
    <style>
        :root {
            --color-pass: #4caf50;
            --color-fail: #f44336;
            --color-warning: #ff9800;
            --color-bg: #f5f7f9;
            --color-text: #333;
            --color-border: #ddd;
            --color-header: #2196F3;
            --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        body {
            font-family: var(--font-family);
            line-height: 1.6;
            color: var(--color-text);
            background: var(--color-bg);
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 20px;
        }
        
        h1 {
            color: var(--color-header);
            margin: 0;
            font-size: 28px;
        }
        
        .timestamp {
            color: #777;
            font-size: 14px;
            margin: 10px 0;
        }
        
        .summary {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            margin-bottom: 30px;
        }
        
        .stat-box {
            padding: 15px;
            min-width: 120px;
            border-radius: 4px;
            margin: 5px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .stat-label {
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
        }
        
        .warning {
            border-left: 4px solid var(--color-warning);
            background: rgba(255, 152, 0, 0.1);
        }
        
        .neutral {
            border-left: 4px solid var(--color-header);
            background: rgba(33, 150, 243, 0.1);
        }
        
        .filters {
            display: flex;
            margin-bottom: 20px;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .filter-button {
            padding: 8px 12px;
            border-radius: 4px;
            border: none;
            background: #eee;
            cursor: pointer;
            font-family: var(--font-family);
        }
        
        .filter-button.active {
            background: var(--color-header);
            color: white;
        }
        
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .test-card {
            background: white;
            border: 1px solid var(--color-border);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .test-header {
            padding: 10px 15px;
            background: #f5f5f5;
            border-bottom: 1px solid var(--color-border);
            font-weight: bold;
        }
        
        .test-content {
            padding: 15px;
        }
        
        .test-title {
            font-size: 16px;
            margin-top: 0;
            margin-bottom: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .test-path {
            font-size: 12px;
            color: #777;
            margin-bottom: 15px;
            word-break: break-all;
        }
        
        .image-container {
            margin-bottom: 15px;
        }
        
        .image-container h3 {
            font-size: 14px;
            margin: 10px 0 5px;
        }
        
        .image-wrapper {
            position: relative;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
            max-height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .image-wrapper canvas,
        .image-wrapper img {
            max-width: 100%;
            max-height: 300px;
            object-fit: contain;
        }
        
        .toggle-diff {
            padding: 6px 12px;
            border-radius: 4px;
            border: none;
            background: var(--color-header);
            color: white;
            cursor: pointer;
            font-family: var(--font-family);
            margin: 10px 0;
        }
        
        .diff-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        
        .threshold-control {
            display: flex;
            align-items: center;
        }
        
        .threshold-control label {
            margin-right: 10px;
            font-size: 14px;
        }
        
        .diff-info {
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .diff-mode-label {
            margin-right: 10px;
            font-size: 14px;
        }
        
        .toggle-baseline {
            padding: 6px 12px;
            border-radius: 4px;
            border: 1px solid var(--color-header);
            background: white;
            color: var(--color-header);
            cursor: pointer;
            font-family: var(--font-family);
        }
        
        .no-results {
            text-align: center;
            padding: 40px;
            font-size: 18px;
            color: #777;
            grid-column: 1 / -1;
        }
        
        footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #777;
            border-top: 1px solid var(--color-border);
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>G+ App Visual Regression Tests</h1>
            <p class="timestamp">Generated on ${new Date(data.timestamp).toLocaleString()}</p>
        </header>
        
        <div class="summary">
            <div class="stat-box neutral">
                <div class="stat-value">${data.totalScreenshots}</div>
                <div class="stat-label">Total Screenshots</div>
            </div>
            <div class="stat-box warning">
                <div class="stat-value">${data.newScreenshots}</div>
                <div class="stat-label">New Screenshots</div>
            </div>
        </div>
        
        <div class="filters">
            <button class="filter-button active" data-filter="all">All Screenshots</button>
            <button class="filter-button" data-filter="changed">Changed</button>
            <button class="filter-button" data-filter="new">New</button>
            <button class="filter-button" data-filter="unchanged">Unchanged</button>
        </div>
        
        <div class="test-grid" id="testGrid">
            ${this.renderScreenshots(data.tests)}
        </div>
        
        <footer>
            <p>G+ App Visual Regression Report • ${new Date().getFullYear()}</p>
        </footer>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const screenshots = ${JSON.stringify(data.tests)};
            const testGrid = document.getElementById('testGrid');
            const filterButtons = document.querySelectorAll('.filter-button');
            
            // Set up image comparison for each screenshot
            screenshots.forEach(screenshot => {
                if (screenshot.baselineExists) {
                    setupComparison(screenshot.id);
                }
            });
            
            // Set up filter buttons
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const filter = this.dataset.filter;
                    
                    // Update active button
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Filter screenshots
                    filterScreenshots(filter);
                });
            });
            
            // Set up toggle baseline buttons
            document.querySelectorAll('.toggle-baseline').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.dataset.id;
                    // In a real implementation, this would update the baseline
                    // For demo purposes, just show a message
                    alert('In a CI environment, this would approve the current image as the new baseline');
                });
            });
        });
        
        function filterScreenshots(filter) {
            const cards = document.querySelectorAll('.test-card');
            
            cards.forEach(card => {
                const isNew = card.dataset.new === 'true';
                const hasChanges = card.dataset.changes === 'true';
                
                switch(filter) {
                    case 'new':
                        card.style.display = isNew ? 'block' : 'none';
                        break;
                    case 'changed':
                        card.style.display = !isNew && hasChanges ? 'block' : 'none';
                        break;
                    case 'unchanged':
                        card.style.display = !isNew && !hasChanges ? 'block' : 'none';
                        break;
                    default:
                        card.style.display = 'block';
                }
            });
            
            // Check if no results are visible
            checkNoResults();
        }
        
        function checkNoResults() {
            const visibleCards = document.querySelectorAll('.test-card[style="display: block;"]').length;
            let noResults = document.querySelector('.no-results');
            
            if (visibleCards === 0) {
                if (!noResults) {
                    noResults = document.createElement('div');
                    noResults.className = 'no-results';
                    noResults.textContent = 'No screenshots match the selected filter';
                    document.getElementById('testGrid').appendChild(noResults);
                }
            } else if (noResults) {
                noResults.remove();
            }
        }
        
        function setupComparison(id) {
            const diffBtn = document.getElementById(\`diffBtn-\${id}\`);
            const baseline = document.getElementById(\`baseline-\${id}\`);
            const current = document.getElementById(\`current-\${id}\`);
            const diffCanvas = document.getElementById(\`diff-\${id}\`);
            const diffInfo = document.getElementById(\`diffInfo-\${id}\`);
            const thresholdInput = document.getElementById(\`threshold-\${id}\`);
            const testCard = document.getElementById(\`card-\${id}\`);
            
            if (!diffBtn || !baseline || !current || !diffCanvas) return;
            
            let diffMode = 'side-by-side';
            let diffPixels = 0;
            let diffPercentage = 0;
            
            const toggleDiff = () => {
                if (diffMode === 'side-by-side') {
                    diffMode = 'diff';
                    baseline.style.display = 'none';
                    current.style.display = 'none';
                    diffCanvas.style.display = 'block';
                    diffBtn.textContent = 'Show Side by Side';
                    compareImages();
                } else {
                    diffMode = 'side-by-side';
                    baseline.style.display = 'block';
                    current.style.display = 'block';
                    diffCanvas.style.display = 'none';
                    diffBtn.textContent = 'Show Differences';
                }
            };
            
            const compareImages = () => {
                const threshold = parseFloat(thresholdInput.value) / 100;
                
                // Load both images
                const img1 = new Image();
                const img2 = new Image();
                
                img1.onload = () => {
                    img2.onload = () => {
                        // Set canvas dimensions to match the images
                        const width = img1.width;
                        const height = img1.height;
                        diffCanvas.width = width;
                        diffCanvas.height = height;
                        
                        // Get canvas context for drawing
                        const ctx = diffCanvas.getContext('2d');
                        
                        // Create canvas for each image
                        const canvas1 = document.createElement('canvas');
                        const canvas2 = document.createElement('canvas');
                        canvas1.width = width;
                        canvas1.height = height;
                        canvas2.width = width;
                        canvas2.height = height;
                        
                        const ctx1 = canvas1.getContext('2d');
                        const ctx2 = canvas2.getContext('2d');
                        
                        ctx1.drawImage(img1, 0, 0);
                        ctx2.drawImage(img2, 0, 0);
                        
                        // Get image data
                        const imageData1 = ctx1.getImageData(0, 0, width, height);
                        const imageData2 = ctx2.getImageData(0, 0, width, height);
                        const diff = ctx.createImageData(width, height);
                        
                        // Compare images using pixelmatch
                        diffPixels = pixelmatch(
                            imageData1.data,
                            imageData2.data,
                            diff.data,
                            width,
                            height,
                            { threshold }
                        );
                        
                        // Calculate diff percentage
                        diffPercentage = (diffPixels / (width * height) * 100).toFixed(2);
                        
                        // Put diff image data on canvas
                        ctx.putImageData(diff, 0, 0);
                        
                        // Update diff info
                        diffInfo.textContent = \`Difference: \${diffPercentage}% (\${diffPixels} pixels)\`;
                        
                        // Set data attribute for filtering
                        if (diffPercentage > 0) {
                            testCard.dataset.changes = 'true';
                        }
                    };
                    img2.src = current.src;
                };
                img1.src = baseline.src;
            };
            
            // Set up event listeners
            diffBtn.addEventListener('click', toggleDiff);
            thresholdInput.addEventListener('change', () => {
                if (diffMode === 'diff') {
                    compareImages();
                }
            });
            
            // Initial comparison
            compareImages();
        }
    </script>
</body>
</html>
    `;
  }
  
  renderScreenshots(screenshots) {
    if (!screenshots || screenshots.length === 0) {
      return '<div class="no-results">No screenshots found</div>';
    }
    
    return screenshots.map(screenshot => {
      const isNew = !screenshot.baselineExists;
      
      return `
        <div class="test-card" id="card-${screenshot.id}" data-new="${isNew}" data-changes="false">
            <div class="test-header">${isNew ? 'New Screenshot' : 'Screenshot Comparison'}</div>
            <div class="test-content">
                <h2 class="test-title">${screenshot.screenshotName}</h2>
                <div class="test-path">${screenshot.testName}</div>
                
                <div class="image-container">
                    ${isNew ? this.renderNewScreenshot(screenshot) : this.renderComparison(screenshot)}
                </div>
            </div>
        </div>
      `;
    }).join('');
  }
  
  renderNewScreenshot(screenshot) {
    return `
        <h3>Current</h3>
        <div class="image-wrapper">
            <img src="${screenshot.currentPath}" alt="Current Screenshot" />
        </div>
        <button class="toggle-baseline" data-id="${screenshot.id}">Approve as Baseline</button>
    `;
  }
  
  renderComparison(screenshot) {
    return `
        <div class="diff-controls">
            <button class="toggle-diff" id="diffBtn-${screenshot.id}">Show Differences</button>
            
            <div class="threshold-control">
                <label for="threshold-${screenshot.id}">Threshold:</label>
                <input type="range" id="threshold-${screenshot.id}" min="1" max="10" value="2" step="0.1" />
            </div>
        </div>
        
        <div class="diff-info" id="diffInfo-${screenshot.id}">Difference: calculating...</div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <div>
                <h3>Baseline</h3>
                <div class="image-wrapper">
                    <img id="baseline-${screenshot.id}" src="${screenshot.baselinePath}" alt="Baseline" />
                </div>
            </div>
            <div>
                <h3>Current</h3>
                <div class="image-wrapper">
                    <img id="current-${screenshot.id}" src="${screenshot.currentPath}" alt="Current" />
                </div>
            </div>
        </div>
        
        <div class="image-wrapper" style="display: none;">
            <canvas id="diff-${screenshot.id}"></canvas>
        </div>
        
        <button class="toggle-baseline" data-id="${screenshot.id}">Approve as Baseline</button>
    `;
  }
}

module.exports = GplusVisualRegressionReporter;