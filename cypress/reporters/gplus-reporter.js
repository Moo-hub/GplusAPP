const mocha = require('mocha');
const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_FAIL, EVENT_TEST_PASS, EVENT_SUITE_BEGIN, EVENT_SUITE_END } = mocha.Runner.constants;

/**
 * Custom Mocha reporter for Cypress tests
 * Provides formatted output and summary statistics
 */
class GplusReporter {
  constructor(runner) {
    this._indents = 0;
    this.passes = 0;
    this.failures = 0;
    this.skipped = 0;
    this.duration = 0;
    this.suites = 0;
    this.tests = 0;
    this.startTime = null;
    this.failureDetails = [];

    const { color } = mocha.reporters.Base;
    this.colors = {
      pass: 90, // bright green
      fail: 31, // red
      skip: 36, // cyan
      suite: 0,  // bold
      duration: 90 // bright green
    };

    runner.on(EVENT_RUN_BEGIN, () => {
      this.startTime = new Date();
      const title = '🌟 G+ App Test Run';
      const separator = '='.repeat(title.length);
      console.log(`\n${separator}`);
      console.log(title);
      console.log(`${separator}\n`);
    });

    runner.on(EVENT_SUITE_BEGIN, (suite) => {
      this.increaseIndent();
      console.log(`${this.indent()}${color('suite', `${suite.title}`)}`);
      this.suites++;
    });

    runner.on(EVENT_SUITE_END, () => {
      this.decreaseIndent();
    });

    runner.on(EVENT_TEST_PASS, (test) => {
      this.passes++;
      this.tests++;
      const duration = test.duration || 0;
      this.duration += duration;
      console.log(
        `${this.indent()}${color('checkmark', '✓')} ${color('pass', test.title)} ${color('duration', `(${duration}ms)`)}`,
      );
    });

    runner.on(EVENT_TEST_FAIL, (test, err) => {
      this.failures++;
      this.tests++;
      const duration = test.duration || 0;
      this.duration += duration;
      console.log(
        `${this.indent()}${color('fail', '✖')} ${color('fail', test.title)} ${color('duration', `(${duration}ms)`)}`,
      );
      
      // Store failure details for later
      this.failureDetails.push({
        title: test.fullTitle(),
        error: err.message,
        stack: err.stack,
        duration
      });
    });

    runner.on(EVENT_TEST_PENDING, (test) => {
      this.skipped++;
      this.tests++;
      console.log(`${this.indent()}${color('skip', '- ')} ${test.title}`);
    });

    runner.on(EVENT_RUN_END, () => {
      const endTime = new Date();
      const duration = endTime - this.startTime;
      
      console.log('\n');
      
      // Print summary statistics
      console.log('📊 Test Summary:');
      console.log(`  Total Suites: ${this.suites}`);
      console.log(`  Total Tests: ${this.tests}`);
      console.log(`  ${color('pass', `Passed: ${this.passes}`)}`);
      console.log(`  ${color('fail', `Failed: ${this.failures}`)}`);
      console.log(`  ${color('skip', `Skipped: ${this.skipped}`)}`);
      console.log(`  Duration: ${formatDuration(duration)}`);
      
      // Print failure details if any
      if (this.failures > 0) {
        console.log('\n');
        console.log('❌ Failure Details:');
        
        this.failureDetails.forEach((failure, index) => {
          console.log(`\n${index + 1}) ${color('fail', failure.title)}`);
          console.log(`   ${color('fail', failure.error)}`);
          
          // Print abbreviated stack trace (first 3 lines)
          const stackLines = failure.stack.split('\n').slice(0, 4);
          stackLines.forEach(line => {
            console.log(`   ${color('fail', line)}`);
          });
        });
      }
      
      // Print final status
      console.log('\n');
      if (this.failures > 0) {
        console.log(color('fail', '❌ Tests Failed'));
      } else {
        console.log(color('pass', '✅ All Tests Passed'));
      }
      console.log('\n');
    });
  }

  indent() {
    return '  '.repeat(this._indents);
  }

  increaseIndent() {
    this._indents++;
  }

  decreaseIndent() {
    this._indents--;
  }
}

// Helper function to format duration in a readable format
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

module.exports = GplusReporter;