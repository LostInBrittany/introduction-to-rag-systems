/**
 * Test RAGmonsters integration with RAG
 * 
 * This test verifies that:
 * 1. RAGmonsters data is properly loaded in the database
 * 2. The RAG pipeline can retrieve relevant monster information
 * 3. The LLM can generate accurate responses based on retrieved context
 */

import { getDatabase, closeDatabase } from '../utils/database.js';
import { getEmbedding } from '../utils/embeddings.js';
import { testLlmConnection, generateLlmResponse } from '../utils/llm.js';
import { createRagPrompt } from '../utils/promptBuilder.js';
import { findSimilarChunks } from '../utils/retrieval.js';

/**
 * Verify that RAGmonsters data exists in the database
 */
async function verifyRagmonstersData() {
  console.log('🔍 Verifying RAGmonsters data in database...');
  
  const db = getDatabase();
  
  // Check if documents exist
  const documentCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  console.log(`📚 Found ${documentCount} documents in the database`);
  
  if (documentCount === 0) {
    console.error('❌ No documents found in the database. Please run loadRagMonsters.js first.');
    return false;
  }
  
  // Check if chunks exist
  const chunkCount = db.prepare('SELECT COUNT(*) as count FROM chunks').get().count;
  console.log(`🧩 Found ${chunkCount} chunks in the database`);
  
  if (chunkCount === 0) {
    console.error('❌ No chunks found in the database. Please run loadRagMonsters.js first.');
    return false;
  }
  
  // Check if chunks have embeddings
  const chunksWithEmbeddings = db.prepare('SELECT COUNT(*) as count FROM chunks WHERE embedding IS NOT NULL').get().count;
  console.log(`🧠 Found ${chunksWithEmbeddings} chunks with embeddings`);
  
  if (chunksWithEmbeddings === 0) {
    console.error('❌ No chunks with embeddings found. Please run loadRagMonsters.js first.');
    return false;
  }
  
  console.log('✅ RAGmonsters data verification successful');
  return true;
}

/**
 * Find relevant chunks for a query
 * @param {string} query - The user query
 * @param {number} limit - Maximum number of chunks to retrieve
 * @returns {Promise<Array<Object>>} Array of relevant chunks
 */
async function findRelevantChunks(query, limit = 3) {
  console.log(`🔎 Finding relevant chunks for query: "${query}"`);
  
  // Generate embedding for the query
  const queryEmbedding = await getEmbedding(query);
  
  // Use the imported findSimilarChunks function from retrieval.js
  const chunks = await findSimilarChunks(queryEmbedding, limit);
  
  console.log(`✅ Found ${chunks.length} relevant chunks`);
  
  return chunks;
}

/**
 * Ask a question about monsters using RAG
 * @param {string} question - The question to ask
 * @returns {Promise<string>} The generated answer
 */
async function askMonsterQuestion(question) {
  console.log(`❓ Asking question: "${question}"`);
  
  // Find relevant chunks
  const relevantChunks = await findRelevantChunks(question);
  
  if (relevantChunks.length === 0) {
    console.log('⚠️ No relevant chunks found for this question');
    
    // Generate response without context
    const noContextPrompt = `Answer this question about fantasy monsters: ${question}\n\nIf you don't know the answer, just say so.`;
    
    console.log('\n📝 Prompt sent to LLM:\n' + '-'.repeat(50));
    console.log(noContextPrompt);
    console.log('-'.repeat(50));
    
    const response = await generateLlmResponse(noContextPrompt);
    return response;
  }
  
  // Create RAG prompt directly from the chunks array
  const prompt = createRagPrompt(relevantChunks, question);
  
  // Log the complete prompt being sent to the LLM
  console.log('\n📝 Prompt sent to LLM:\n' + '-'.repeat(50));
  console.log(prompt);
  console.log('-'.repeat(50));
  
  // Generate response
  console.log('🤖 Generating response from LLM...');
  const response = await generateLlmResponse(prompt);
  
  return response;
}

/**
 * Run the RAGmonsters RAG test
 */
async function testRagmonstersRag() {
  console.log('🧪 Testing RAGmonsters RAG integration...\n');
  
  // Step 1: Test LLM connection
  console.log('🔌 Testing LLM connection...');
  const llmTest = await testLlmConnection();
  if (!llmTest.success) {
    console.error('❌ LLM connection failed:', llmTest.message);
    return;
  }
  console.log('✅ LLM connection successful\n');
  
  // Step 2: Verify RAGmonsters data
  const dataVerified = await verifyRagmonstersData();
  if (!dataVerified) {
    return;
  }
  
  // Step 3: Ask questions about RAGmonsters
  const questions = [
    "What are the physical characteristics of the Fungalnet monster?",
    "What are the primary and secondary powers of the Fungalnet monster?"
  ];
  
  for (const question of questions) {
    console.log('\n' + '='.repeat(50));
    console.log(`Question: ${question}`);
    console.log('='.repeat(50));
    
    const answer = await askMonsterQuestion(question);
    
    console.log('\nAnswer:');
    console.log(answer);
  }
  
  console.log('\n🎉 RAGmonsters RAG test completed successfully!');
}

// Run the test
testRagmonstersRag().catch(error => {
  console.error('Error running RAGmonsters RAG test:', error);
}).finally(() => {
  closeDatabase();
});
