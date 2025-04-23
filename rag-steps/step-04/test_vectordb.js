/**
 * Test script for vector database storage and retrieval
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument } from './utils/documentProcessor.js';
import { chunkDocument } from './utils/documentChunker.js';
import { getEmbedding } from './utils/embeddings.js';
import { 
  storeDocumentWithChunks, 
  findSimilarChunks,
  getAllDocuments,
  closeDatabase
} from './utils/vectorStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test document path
const MARKDOWN_FILE_PATH = path.join(__dirname, 'data/samples/sample.md');

/**
 * Test storing a document in the vector database
 */
async function testStoreDocument() {
  console.log('🧪 Testing document storage in vector database...');
  
  try {
    // Process the document
    console.log('\n📝 Processing document:');
    const document = await processDocument(MARKDOWN_FILE_PATH);
    console.log(`Document loaded: ${document.metadata.filename}`);
    
    // Chunk the document and generate embeddings
    console.log('\n🔪 Chunking document and generating embeddings:');
    const chunks = await chunkDocument(document, { 
      strategy: 'character',
      chunkSize: 200,
      chunkOverlap: 50
    });
    console.log(`Created ${chunks.length} chunks with embeddings`);
    
    // Store document and chunks in the vector database
    console.log('\n💾 Storing document and chunks in vector database:');
    const result = storeDocumentWithChunks(document, chunks);
    console.log(`Document stored with ID: ${result.documentId}`);
    console.log(`Stored ${result.chunkIds.length} chunks`);
    
    console.log('\n✅ Document storage test completed successfully!');
    return result.documentId;
  } catch (error) {
    console.error('❌ Document storage test failed:', error);
    throw error;
  }
}

/**
 * Test searching for similar chunks
 * @param {string} query - Query text
 */
async function testSearchSimilarChunks(query) {
  console.log(`\n🧪 Testing vector search for query: "${query}"`);
  
  try {
    // Generate embedding for the query
    console.log('\n🔢 Generating query embedding:');
    const queryEmbedding = await getEmbedding(query);
    console.log('Query embedding generated');
    
    // Find similar chunks
    console.log('\n🔍 Searching for similar chunks:');
    const similarChunks = findSimilarChunks(queryEmbedding, 3, 0.5);
    console.log(`Found ${similarChunks.length} similar chunks`);
    
    // Display results
    if (similarChunks.length > 0) {
      console.log('\nSearch results:');
      similarChunks.forEach((chunk, index) => {
        console.log(`\nResult ${index + 1} (similarity: ${chunk.similarity.toFixed(4)}):`);
        console.log(`Source: ${chunk.title} (${chunk.source})`);
        console.log(`Text: ${chunk.text.substring(0, 150)}...`);
      });
    } else {
      console.log('No similar chunks found');
    }
    
    console.log('\n✅ Vector search test completed successfully!');
  } catch (error) {
    console.error('❌ Vector search test failed:', error);
  }
}

/**
 * Test listing all documents
 */
function testListDocuments() {
  console.log('\n🧪 Testing document listing:');
  
  try {
    const documents = getAllDocuments();
    console.log(`Found ${documents.length} documents in the database`);
    
    if (documents.length > 0) {
      console.log('\nDocuments:');
      documents.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.title} (${doc.filetype}) - ${doc.chunk_count} chunks`);
      });
    }
    
    console.log('\n✅ Document listing test completed successfully!');
  } catch (error) {
    console.error('❌ Document listing test failed:', error);
  }
}

// Run the tests
async function runTests() {
  try {
    // Store a document
    await testStoreDocument();
    
    // List all documents
    testListDocuments();
    
    // Search for similar chunks
    await testSearchSimilarChunks('markdown features');
    
    // Close database connection
    closeDatabase();
  } catch (error) {
    console.error('Error during vector database tests:', error);
    closeDatabase();
  }
}

runTests().catch(error => {
  console.error('Error during tests:', error);
  closeDatabase();
});
