const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration
const TEST_COMMAND = 'npm test -- --run a11y --reporter verbose';
const OUTPUT_FILE = path.join(__dirname, 'accessibility-report.md');
const SUMMARY_FILE = path.join(__dirname, 'accessibility-summary.json');

/**
 * Run accessibility tests and generate a report
 */
async function runAccessibilityTests() {
  console.log('Running accessibility tests...');
  
  try {
    const { stdout, stderr } = await execPromise(TEST_COMMAND);
    
    // Parse the test results
    const results = parseTestResults(stdout);
    
    // Generate the report
    generateMarkdownReport(results);
    
    // Save summary data
    saveSummaryData(results);
    
    console.log(`\nReport generated successfully: ${OUTPUT_FILE}`);
    console.log(`Summary data saved to: ${SUMMARY_FILE}`);
    
    // Log the summary to console
    logSummary(results);
    
    // Check if there were failures
    if (results.failedTests.length > 0) {
      console.error('\n⚠️ Accessibility tests found issues that need to be addressed');
      process.exit(1); // Exit with error code
    } else {
      console.log('\n✅ All accessibility tests passed!');
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

/**
 * Parse test results from stdout
 */
function parseTestResults(stdout) {
  // Initialize results object
  const results = {
    passedTests: [],
    failedTests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      files: {}
    }
  };
  
  // Basic parsing logic - this would need to be enhanced based on the actual output format
  const lines = stdout.split('\n');
  let currentTest = null;
  let currentFile = null;
  
  for (const line of lines) {
    // Detect test file
    if (line.includes('__tests__') && line.includes('.test.')) {
      currentFile = line.trim();
      results.summary.files[currentFile] = { passed: 0, failed: 0 };
    }
    
    // Detect passed test
    if (line.includes('√') && !line.includes('❯')) {
      const testName = line.replace('√', '').trim();
      results.passedTests.push({
        file: currentFile,
        name: testName
      });
      results.summary.passed++;
      results.summary.total++;
      
      if (currentFile && results.summary.files[currentFile]) {
        results.summary.files[currentFile].passed++;
      }
    }
    
    // Detect failed test
    if (line.includes('×')) {
      const testName = line.replace('×', '').trim();
      results.failedTests.push({
        file: currentFile,
        name: testName
      });
      results.summary.failed++;
      results.summary.total++;
      
      if (currentFile && results.summary.files[currentFile]) {
        results.summary.files[currentFile].failed++;
      }
    }
  }
  
  return results;
}

/**
 * Generate a markdown report from the test results
 */
function generateMarkdownReport(results) {
  const date = new Date().toISOString().split('T')[0];
  
  let markdown = `# Accessibility Test Report\n\n`;
  markdown += `**Date:** ${date}\n\n`;
  
  // Add summary
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${results.summary.total}\n`;
  markdown += `- **Passed:** ${results.summary.passed} (${Math.round(results.summary.passed / results.summary.total * 100)}%)\n`;
  markdown += `- **Failed:** ${results.summary.failed} (${Math.round(results.summary.failed / results.summary.total * 100)}%)\n\n`;
  
  // Add file breakdown
  markdown += `## Test Files\n\n`;
  for (const [file, counts] of Object.entries(results.summary.files)) {
    const total = counts.passed + counts.failed;
    const passRate = Math.round(counts.passed / total * 100);
    markdown += `### ${file}\n\n`;
    markdown += `- Tests: ${total} (${counts.passed} passed, ${counts.failed} failed)\n`;
    markdown += `- Pass Rate: ${passRate}%\n\n`;
  }
  
  // Add passed tests
  markdown += `## Passed Tests\n\n`;
  if (results.passedTests.length === 0) {
    markdown += `No tests passed.\n\n`;
  } else {
    for (const test of results.passedTests) {
      markdown += `- ✅ ${test.name} (${test.file})\n`;
    }
    markdown += '\n';
  }
  
  // Add failed tests
  markdown += `## Failed Tests\n\n`;
  if (results.failedTests.length === 0) {
    markdown += `No failed tests! 🎉\n\n`;
  } else {
    for (const test of results.failedTests) {
      markdown += `- ❌ ${test.name} (${test.file})\n`;
    }
    markdown += '\n';
  }
  
  // Add recommendations
  markdown += `## Recommendations\n\n`;
  if (results.failedTests.length === 0) {
    markdown += `All accessibility tests are passing. Continue monitoring as new features are added.\n\n`;
  } else {
    markdown += `### Priority Issues to Address:\n\n`;
    
    // Group failed tests by file
    const issuesByFile = {};
    for (const test of results.failedTests) {
      if (!issuesByFile[test.file]) {
        issuesByFile[test.file] = [];
      }
      issuesByFile[test.file].push(test.name);
    }
    
    // List files and their issues
    for (const [file, issues] of Object.entries(issuesByFile)) {
      markdown += `#### ${file}\n\n`;
      for (const issue of issues) {
        markdown += `- ${issue}\n`;
      }
      markdown += '\n';
    }
    
    markdown += `Refer to the [Accessibility Implementation Checklist](./ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md) for guidance on fixing these issues.\n\n`;
  }
  
  // Add WCAG compliance note
  markdown += `## WCAG 2.1 Compliance\n\n`;
  markdown += `The tests focus on ensuring compliance with WCAG 2.1 AA standards, covering:\n\n`;
  markdown += `- Perceivable: Information must be presentable to users in ways they can perceive\n`;
  markdown += `- Operable: User interface components must be operable\n`;
  markdown += `- Understandable: Information and operation must be understandable\n`;
  markdown += `- Robust: Content must be robust enough to be interpreted by a wide variety of user agents\n\n`;
  
  // Write the report to a file
  fs.writeFileSync(OUTPUT_FILE, markdown);
}

/**
 * Save summary data as JSON
 */
function saveSummaryData(results) {
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(results.summary, null, 2));
}

/**
 * Log summary to console
 */
function logSummary(results) {
  console.log('\n=== ACCESSIBILITY TEST SUMMARY ===');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed} (${Math.round(results.summary.passed / results.summary.total * 100)}%)`);
  console.log(`Failed: ${results.summary.failed} (${Math.round(results.summary.failed / results.summary.total * 100)}%)`);
  
  if (results.failedTests.length > 0) {
    console.log('\nFailed Tests:');
    for (const test of results.failedTests) {
      console.log(`- ${test.name}`);
    }
  }
}

// Run the tests
runAccessibilityTests();