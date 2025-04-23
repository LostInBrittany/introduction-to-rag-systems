/**
 * Test script for the RAG pipeline
 * Tests the complete RAG pipeline from query to response
 */

import { processQuery } from '../utils/ragPipeline.js';
import { getEmbedding } from '../utils/embeddings.js';
import { retrieveTopK } from '../utils/retrieval.js';
import { createRagPrompt } from '../utils/promptBuilder.js';
import { testLlmConnection } from '../utils/llmConnector.js';
import { getDatabase } from '../utils/database.js';

// Test database connection
function testDatabaseConnection() {
  console.log('\n📊 Testing database connection...');
  try {
    const db = getDatabase();
    const documents = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const chunks = db.prepare('SELECT COUNT(*) as count FROM chunks').get();
    
    console.log(`✅ Database connection successful`);
    console.log(`📄 Documents: ${documents.count}`);
    console.log(`🧩 Chunks: ${chunks.count}`);
    return true;
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

// Test embedding generation
async function testEmbedding() {
  console.log('\n🧠 Testing embedding generation...');
  try {
    const query = 'What is markdown?';
    const embedding = await getEmbedding(query);
    
    if (Array.isArray(embedding) && embedding.length > 0) {
      console.log(`✅ Embedding generation successful`);
      console.log(`📏 Embedding dimensions: ${embedding.length}`);
      return true;
    } else {
      console.error('❌ Embedding generation failed: Invalid embedding format');
      return false;
    }
  } catch (error) {
    console.error(`❌ Embedding generation failed: ${error.message}`);
    return false;
  }
}

// Test retrieval
async function testRetrieval() {
  console.log('\n🔍 Testing retrieval...');
  try {
    const query = 'What is markdown?';
    const embedding = await getEmbedding(query);
    const chunks = retrieveTopK(embedding, 3);
    
    if (Array.isArray(chunks) && chunks.length > 0) {
      console.log(`✅ Retrieval successful`);
      console.log(`🧩 Retrieved ${chunks.length} chunks`);
      console.log(`📄 First chunk: "${chunks[0].text.substring(0, 100)}..."`);
      return true;
    } else {
      console.error('❌ Retrieval failed: No chunks retrieved');
      return false;
    }
  } catch (error) {
    console.error(`❌ Retrieval failed: ${error.message}`);
    return false;
  }
}

// Test LLM connection
async function testLlm() {
  console.log('\n🤖 Testing LLM connection...');
  try {
    const result = await testLlmConnection();
    
    if (result.success) {
      console.log(`✅ LLM connection successful`);
      console.log(`💬 LLM response: "${result.response}"`);
      return true;
    } else {
      console.error(`❌ LLM connection failed: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ LLM connection failed: ${error.message}`);
    return false;
  }
}

// Test complete RAG pipeline
async function testRagPipeline() {
  console.log('\n🔄 Testing complete RAG pipeline...');
  try {
    const query = 'What is markdown?';
    const result = await processQuery(query);
    
    if (result.success) {
      console.log(`✅ RAG pipeline successful`);
      console.log(`🧩 Used ${result.chunks.length} chunks for context`);
      console.log(`💬 Answer: "${result.answer.substring(0, 200)}..."`);
      return true;
    } else {
      console.error(`❌ RAG pipeline failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ RAG pipeline failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting RAG pipeline tests...');
  
  const dbSuccess = testDatabaseConnection();
  if (!dbSuccess) {
    console.error('❌ Tests aborted: Database connection failed');
    process.exit(1);
  }
  
  const embeddingSuccess = await testEmbedding();
  if (!embeddingSuccess) {
    console.error('❌ Tests aborted: Embedding generation failed');
    process.exit(1);
  }
  
  const retrievalSuccess = await testRetrieval();
  if (!retrievalSuccess) {
    console.error('❌ Tests aborted: Retrieval failed');
    process.exit(1);
  }
  
  const llmSuccess = await testLlm();
  if (!llmSuccess) {
    console.warn('⚠️ Warning: LLM connection failed, but continuing with tests');
  }
  
  const pipelineSuccess = await testRagPipeline();
  
  console.log('\n📋 Test Summary:');
  console.log(`Database: ${dbSuccess ? '✅' : '❌'}`);
  console.log(`Embedding: ${embeddingSuccess ? '✅' : '❌'}`);
  console.log(`Retrieval: ${retrievalSuccess ? '✅' : '❌'}`);
  console.log(`LLM: ${llmSuccess ? '✅' : '⚠️'}`);
  console.log(`RAG Pipeline: ${pipelineSuccess ? '✅' : '❌'}`);
  
  if (dbSuccess && embeddingSuccess && retrievalSuccess && pipelineSuccess) {
    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  } else {
    console.error('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`❌ Unexpected error: ${error.message}`);
  process.exit(1);
});
