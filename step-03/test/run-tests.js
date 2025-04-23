/**
 * Test runner for step-03
 * Runs tests from step-01, step-02, and step-03 in order
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STEP_DIR = dirname(__dirname);
const PROJECT_ROOT = resolve(STEP_DIR, '..');

/**
 * Run a test script and return a promise that resolves when the script completes
 * @param {string} scriptPath - Path to the test script
 * @param {string} description - Description of the test
 * @returns {Promise<boolean>} - Promise that resolves to true if the test passed, false otherwise
 */
function runTest(scriptPath, description) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running ${description}: ${scriptPath}`);
    console.log('='.repeat(50));
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      const passed = !error;
      console.log('='.repeat(50));
      console.log(`${passed ? '✅' : '❌'} ${description} ${passed ? 'PASSED' : 'FAILED'}`);
      resolve(passed);
    });
  });
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
  console.log('🧪 Running all tests for step-03\n');
  
  const tests = [
    // Step 1 test
    {
      path: join(PROJECT_ROOT, 'step-01', 'test', 'test_setup.js'),
      description: 'Step 1 - Environment Setup Test'
    },
    // Step 2 tests
    {
      path: join(PROJECT_ROOT, 'step-02', 'test', 'test_setup.js'),
      description: 'Step 2 - Environment Setup Test'
    },
    {
      path: join(PROJECT_ROOT, 'step-02', 'test', 'test_ingest.js'),
      description: 'Step 2 - Document Ingestion Test'
    },
    // Step 3 tests
    {
      path: join(__dirname, 'test_setup.js'),
      description: 'Step 3 - Environment Setup Test'
    },
    {
      path: join(__dirname, 'test_chunking.js'),
      description: 'Step 3 - Document Chunking Test'
    }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    const passed = await runTest(test.path, test.description);
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log(`\n${allPassed ? '✅' : '❌'} All tests ${allPassed ? 'PASSED' : 'FAILED'}`);
  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
