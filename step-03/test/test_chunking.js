/**
 * Test script for document chunking and embedding
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument } from '../utils/documentProcessor.js';
import { chunkDocument } from '../utils/documentChunker.js';
import { splitByCharacterCount, splitByParagraphs } from '../utils/chunking/simpleChunker.js';
import { splitRecursively, splitByHeadings } from '../utils/chunking/recursiveChunker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test document path
const MARKDOWN_FILE_PATH = path.join(__dirname, '../data/samples/sample.md');

/**
 * Test different chunking strategies
 */
async function testChunkingStrategies() {
  console.log('🧪 Testing document chunking strategies...');
  
  try {
    // Process the document
    console.log('\n📝 Processing document:');
    const document = await processDocument(MARKDOWN_FILE_PATH);
    console.log(`Document loaded: ${document.metadata.filename}`);
    
    // Test character-based chunking
    console.log('\n🔤 Testing character-based chunking:');
    const characterChunks = splitByCharacterCount(document.text, 200, 50);
    console.log(`Created ${characterChunks.length} character-based chunks`);
    console.log('First chunk:', characterChunks[0]);
    
    // Test paragraph-based chunking
    console.log('\n📋 Testing paragraph-based chunking:');
    const paragraphChunks = splitByParagraphs(document.text, 2, 1);
    console.log(`Created ${paragraphChunks.length} paragraph-based chunks`);
    console.log('First chunk:', paragraphChunks[0]);
    
    // Test recursive chunking
    console.log('\n🔄 Testing recursive chunking:');
    const recursiveChunks = splitRecursively(document.text, ['\n\n', '\n', '. '], 200, 50);
    console.log(`Created ${recursiveChunks.length} recursive chunks`);
    console.log('First chunk:', recursiveChunks[0]);
    
    // Test heading-based chunking
    console.log('\n📑 Testing heading-based chunking:');
    const headingChunks = splitByHeadings(document.text, 1);
    console.log(`Created ${headingChunks.length} heading-based chunks`);
    console.log('First chunk:', headingChunks[0]);
    
    console.log('\n✅ Chunking strategies test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Chunking strategies test failed:', error);
    return false;
  }
}

/**
 * Test document chunking with embeddings
 */
async function testChunkingWithEmbeddings() {
  console.log('\n🧪 Testing document chunking with embeddings...');
  
  try {
    // Process the document
    const document = await processDocument(MARKDOWN_FILE_PATH);
    
    // Test character-based chunking with embeddings
    console.log('\n🔤 Testing character-based chunking with embeddings:');
    const characterChunksWithEmbeddings = await chunkDocument(document, { 
      strategy: 'character',
      chunkSize: 200,
      chunkOverlap: 50
    });
    
    console.log(`Created ${characterChunksWithEmbeddings.length} chunks with embeddings`);
    console.log('First chunk text:', characterChunksWithEmbeddings[0].text);
    console.log('First chunk embedding (first 5 dimensions):', 
      characterChunksWithEmbeddings[0].embedding.slice(0, 5));
    
    console.log('\n✅ Chunking with embeddings test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Chunking with embeddings test failed:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  const strategiesSuccess = await testChunkingStrategies();
  const embeddingsSuccess = await testChunkingWithEmbeddings();
  
  // Exit with appropriate code
  process.exit(strategiesSuccess && embeddingsSuccess ? 0 : 1);
}

runTests().catch(error => {
  console.error('Error during chunking tests:', error);
  process.exit(1);
});
