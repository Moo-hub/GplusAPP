const mocha = require('mocha');
const fs = require('fs');
const path = require('path');
const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_FAIL, EVENT_TEST_PASS, EVENT_SUITE_BEGIN, EVENT_SUITE_END, EVENT_TEST_PENDING } = mocha.Runner.constants;

/**
 * HTML Reporter for Cypress tests
 * Generates a static HTML report with test results
 */
class GplusHtmlReporter {
  constructor(runner, options) {
    this.stats = {
      suites: 0,
      tests: 0,
      passes: 0,
      failures: 0,
      skipped: 0,
      duration: 0,
      startTime: new Date(),
      endTime: null
    };
    
    this.suites = [];
    this.currentSuite = null;
    this.options = options || {};
    this.reportDir = path.resolve(this.options.reporterOptions?.reportDir || 'cypress/reports');
    this.reportFilename = this.options.reporterOptions?.reportFilename || 'test-results.html';
    
    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
    
    runner.on(EVENT_RUN_BEGIN, () => {
      this.stats.startTime = new Date();
    });
    
    runner.on(EVENT_SUITE_BEGIN, (suite) => {
      if (suite.root) return;
      
      this.stats.suites++;
      
      const newSuite = {
        title: suite.title,
        file: suite.file,
        tests: [],
        suites: [],
        parent: this.currentSuite
      };
      
      if (this.currentSuite) {
        this.currentSuite.suites.push(newSuite);
      } else {
        this.suites.push(newSuite);
      }
      
      this.currentSuite = newSuite;
    });
    
    runner.on(EVENT_SUITE_END, () => {
      if (this.currentSuite) {
        this.currentSuite = this.currentSuite.parent;
      }
    });
    
    runner.on(EVENT_TEST_PASS, (test) => {
      if (!this.currentSuite) return;
      
      this.stats.passes++;
      this.stats.tests++;
      this.stats.duration += test.duration;
      
      this.currentSuite.tests.push({
        title: test.title,
        state: 'passed',
        duration: test.duration,
        code: test.body
      });
    });
    
    runner.on(EVENT_TEST_FAIL, (test, err) => {
      if (!this.currentSuite) return;
      
      this.stats.failures++;
      this.stats.tests++;
      this.stats.duration += test.duration;
      
      this.currentSuite.tests.push({
        title: test.title,
        state: 'failed',
        duration: test.duration,
        error: {
          message: err.message,
          stack: err.stack
        },
        code: test.body
      });
    });
    
    runner.on(EVENT_TEST_PENDING, (test) => {
      if (!this.currentSuite) return;
      
      this.stats.skipped++;
      this.stats.tests++;
      
      this.currentSuite.tests.push({
        title: test.title,
        state: 'skipped',
        code: test.body
      });
    });
    
    runner.on(EVENT_RUN_END, () => {
      this.stats.endTime = new Date();
      this.generateReport();
    });
  }
  
  generateReport() {
    const data = {
      stats: this.stats,
      suites: this.suites,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const html = this.renderHtml(data);
    const reportPath = path.join(this.reportDir, this.reportFilename);
    
    fs.writeFileSync(reportPath, html);
    console.log(`\nHTML report generated at: ${reportPath}\n`);
  }
  
  renderHtml(data) {
    const passPercent = data.stats.tests ? Math.round((data.stats.passes / data.stats.tests) * 100) : 0;
    const duration = data.stats.endTime - data.stats.startTime;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>G+ App Test Results</title>
    <style>
        :root {
            --color-pass: #4caf50;
            --color-fail: #f44336;
            --color-skip: #ff9800;
            --color-bg: #f9f9f9;
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
        
        .passed {
            border-left: 4px solid var(--color-pass);
            background: rgba(76, 175, 80, 0.1);
        }
        
        .failed {
            border-left: 4px solid var(--color-fail);
            background: rgba(244, 67, 54, 0.1);
        }
        
        .skipped {
            border-left: 4px solid var(--color-skip);
            background: rgba(255, 152, 0, 0.1);
        }
        
        .neutral {
            border-left: 4px solid var(--color-header);
            background: rgba(33, 150, 243, 0.1);
        }
        
        .progress-bar {
            height: 8px;
            border-radius: 4px;
            margin: 10px 0 20px;
            background: #e0e0e0;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--color-pass);
            width: ${passPercent}%;
            transition: width 0.5s ease;
        }
        
        .suite {
            margin-bottom: 20px;
            border: 1px solid var(--color-border);
            border-radius: 4px;
        }
        
        .suite-header {
            padding: 10px 15px;
            background: #f5f5f5;
            border-bottom: 1px solid var(--color-border);
            font-weight: bold;
            cursor: pointer;
        }
        
        .suite-content {
            padding: 0 15px;
        }
        
        .test {
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
        }
        
        .test.passed {
            background: rgba(76, 175, 80, 0.05);
        }
        
        .test.failed {
            background: rgba(244, 67, 54, 0.05);
        }
        
        .test.skipped {
            background: rgba(255, 152, 0, 0.05);
        }
        
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .test-title {
            font-weight: bold;
            flex-grow: 1;
        }
        
        .test-duration {
            font-size: 14px;
            color: #777;
            white-space: nowrap;
        }
        
        .test-error {
            margin-top: 10px;
            padding: 10px;
            background: #ffebee;
            border-left: 3px solid var(--color-fail);
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 14px;
            overflow: auto;
            max-height: 300px;
        }
        
        .toggle-btn {
            background: none;
            border: none;
            color: #2196F3;
            cursor: pointer;
            padding: 0;
            font-size: 14px;
            text-decoration: underline;
        }
        
        .hidden {
            display: none;
        }
        
        footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #777;
            border-top: 1px solid var(--color-border);
            padding-top: 20px;
        }
        
        @media (max-width: 768px) {
            .summary {
                flex-direction: column;
            }
            
            .stat-box {
                width: 100%;
                margin: 5px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>G+ App Test Results</h1>
            <p class="timestamp">Generated on ${new Date(data.timestamp).toLocaleString()}</p>
        </header>
        
        <div class="summary">
            <div class="stat-box neutral">
                <div class="stat-value">${data.stats.suites}</div>
                <div class="stat-label">Suites</div>
            </div>
            <div class="stat-box neutral">
                <div class="stat-value">${data.stats.tests}</div>
                <div class="stat-label">Tests</div>
            </div>
            <div class="stat-box passed">
                <div class="stat-value">${data.stats.passes}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-box failed">
                <div class="stat-value">${data.stats.failures}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-box skipped">
                <div class="stat-value">${data.stats.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat-box neutral">
                <div class="stat-value">${this.formatDuration(duration)}</div>
                <div class="stat-label">Duration</div>
            </div>
        </div>
        
        <div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <div>Pass Rate: ${passPercent}%</div>
                <div>${data.stats.passes} / ${data.stats.tests} tests passed</div>
            </div>
        </div>
        
        <div id="suites">
            ${this.renderSuites(data.suites)}
        </div>
        
        <footer>
            <p>G+ App Test Report • ${new Date().getFullYear()}</p>
        </footer>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Toggle suite content visibility
            document.querySelectorAll('.suite-header').forEach(header => {
                header.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    content.classList.toggle('hidden');
                });
            });
            
            // Toggle code visibility
            document.querySelectorAll('.toggle-btn').forEach(button => {
                button.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const target = document.getElementById(this.dataset.target);
                    target.classList.toggle('hidden');
                    this.textContent = target.classList.contains('hidden') ? 'Show' : 'Hide';
                });
            });
        });
    </script>
</body>
</html>
    `;
  }
  
  renderSuites(suites, level = 0) {
    if (!suites || suites.length === 0) return '';
    
    return suites.map((suite, index) => {
      const indentation = '  '.repeat(level);
      const suiteId = `suite-${level}-${index}`;
      
      return `
        <div class="suite">
            <div class="suite-header">
                ${indentation}${suite.title}
            </div>
            <div class="suite-content">
                ${this.renderTests(suite.tests, suiteId)}
                ${this.renderSuites(suite.suites, level + 1)}
            </div>
        </div>
      `;
    }).join('');
  }
  
  renderTests(tests, suiteId) {
    if (!tests || tests.length === 0) return '';
    
    return tests.map((test, index) => {
      const testId = `${suiteId}-test-${index}`;
      const codeId = `${testId}-code`;
      
      let content = `
        <div class="test ${test.state}">
            <div class="test-header">
                <div class="test-title">${test.title}</div>
                <div class="test-duration">${this.formatDuration(test.duration || 0)}</div>
            </div>
      `;
      
      if (test.state === 'failed' && test.error) {
        content += `
            <div class="test-error">
                <strong>Error:</strong> ${this.escapeHtml(test.error.message)}
                <br>
                <br>
                <strong>Stack:</strong> ${this.escapeHtml(test.error.stack)}
            </div>
        `;
      }
      
      if (test.code) {
        content += `
            <div>
                <button class="toggle-btn" data-target="${codeId}">Show</button> code
                <pre id="${codeId}" class="hidden">${this.escapeHtml(test.code)}</pre>
            </div>
        `;
      }
      
      content += `</div>`;
      return content;
    }).join('');
  }
  
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

module.exports = GplusHtmlReporter;