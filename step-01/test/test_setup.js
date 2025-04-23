import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check if a Node.js package is installed
 * @param {string} packageName - Name of the package to check
 * @returns {boolean} Whether the package is installed
 */
function checkPackage(packageName) {
  try {
    // In ES modules, we can't use require.resolve directly
    // Instead, check if package.json exists in node_modules
    // Look in the parent directory's node_modules since we moved the test file to a subdirectory
    const packagePath = path.join(__dirname, '..', 'node_modules', packageName, 'package.json');
    return fs.existsSync(packagePath);
  } catch (e) {
    return false;
  }
}

/**
 * Check if the LLAMA_API_KEY is set
 * @returns {boolean} Whether the API key is set
 */
function checkApiKey() {
  const apiKey = process.env.LLAMA_API_KEY;
  return !!apiKey;
}

/**
 * Test connection to LLaMA API
 * @returns {Promise<Object>} Result of the test
 */
async function testLlmApi() {
  try {
    const { testLlmConnection } = await import('../utils/llm.js');
    return await testLlmConnection();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test the embedding model
 * @returns {Promise<Object>} Result of the test
 */
async function testEmbeddingModel() {
  try {
    const { testEmbedding } = await import('../utils/embeddings.js');
    return await testEmbedding();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function main() {
  console.log('🧪 Testing RAG environment setup...');
  
  // Check required packages
  const requiredPackages = [
    'express', 'dotenv', 'cors', 
    '@xenova/transformers', 'better-sqlite3', 'sqlite-vec'
  ];
  
  console.log('\n📦 Checking required packages:');
  let allPackagesInstalled = true;
  for (const packageName of requiredPackages) {
    const installed = checkPackage(packageName);
    const status = installed ? '✅' : '❌';
    console.log(`  ${status} ${packageName}`);
    if (!installed) {
      allPackagesInstalled = false;
    }
  }
  
  // Check API key
  console.log('\n🔑 Checking API key:');
  const apiKeySet = checkApiKey();
  const apiStatus = apiKeySet ? '✅' : '❌';
  console.log(`  ${apiStatus} LLAMA_API_KEY`);
  
  // Test LLM connection
  console.log('\n🤖 Testing LLM API connection:');
  let llmSuccess = false;
  if (apiKeySet) {
    const llmResult = await testLlmApi();
    llmSuccess = llmResult.success;
    const llmStatus = llmSuccess ? '✅' : '❌';
    console.log(`  ${llmStatus} LLaMA API connection`);
    if (!llmSuccess) {
      console.log(`  Error: ${llmResult.error}`);
      if (llmResult.url) {
        console.log(`  API URL used: ${llmResult.url}`);
      }
      console.log(`  Check if your API endpoint is correct and accessible.`);
    }
  } else {
    console.log('  ⚠️ Skipping LLM test (API key not set)');
  }
  
  // Test embedding model
  console.log('\n🔢 Testing embedding model:');
  const embeddingResult = await testEmbeddingModel();
  const embeddingSuccess = embeddingResult.success;
  const embeddingStatus = embeddingSuccess ? '✅' : '❌';
  console.log(`  ${embeddingStatus} Embedding model`);
  console.log(`  ${embeddingResult.message}`);
  
  // Overall status
  console.log('\n📋 Overall setup status:');
  const allTestsPassed = allPackagesInstalled && apiKeySet && (llmSuccess || !apiKeySet) && embeddingSuccess;
  
  if (allTestsPassed) {
    console.log('✅ Setup complete! Your environment is ready for RAG development.');
  } else {
    console.log('❌ Setup incomplete. Please address the issues above.');
  }
  
  // Exit with appropriate code
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the main function
main().catch(error => {
  console.error('Error during setup test:', error);
  process.exit(1);
});
