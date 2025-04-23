/**
 * Test runner for step-05
 * Runs all test files in sequence
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define all test files to run in sequence
const testFiles = [
  'test_setup.js',
  'test_embedding.js',
  'test_api.js',
  'test_direct.js',
  'test_ragmonsters_pipeline.js'
];

// Run tests sequentially
async function runTests() {
  console.log('🧪 Running all tests for step-05...');
  
  for (const testFile of testFiles) {
    const fullPath = join(__dirname, testFile);
    console.log(`\n🧪 Running test: ${testFile}`);
    
    try {
      // Execute the test and wait for it to complete
      const { stdout, stderr } = await new Promise((resolve, reject) => {
        exec(`node ${fullPath}`, (error, stdout, stderr) => {
          if (error) {
            reject({ error, stdout, stderr });
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
      
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      console.log(`✅ Test ${testFile} completed successfully`);
    } catch ({ error, stdout, stderr }) {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      console.error(`❌ Test ${testFile} failed with error: ${error.message}`);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All tests completed successfully');
  process.exit(0);
}

runTests().catch(error => {
  console.error(`❌ Unexpected error running tests: ${error.message}`);
  process.exit(1);
});
