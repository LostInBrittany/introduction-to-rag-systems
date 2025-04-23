/**
 * Test runner for step-01
 * Simply runs the test_setup.js file
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run the test_setup.js file
const testFile = join(__dirname, 'test_setup.js');
console.log(`🧪 Running test: ${testFile}`);

exec(`node ${testFile}`, (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  
  if (error) {
    console.error(`❌ Test failed with error: ${error.message}`);
    process.exit(1);
  } else {
    console.log('✅ Test completed successfully');
    process.exit(0);
  }
});
