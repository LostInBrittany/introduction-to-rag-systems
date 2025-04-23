/**
 * Document chunker
 * Processes documents into chunks with embeddings
 */

import { splitByCharacterCount, splitByParagraphs } from './chunking/simpleChunker.js';
import { splitRecursively, splitByHeadings } from './chunking/recursiveChunker.js';
import { generateChunkEmbeddings, generateChunkEmbeddingsWithMetadata } from './embeddings/chunkEmbeddings.js';

/**
 * Chunk options for different strategies
 * @typedef {Object} ChunkOptions
 * @property {string} strategy - Chunking strategy to use
 * @property {number} [chunkSize] - Target size of each chunk in characters
 * @property {number} [chunkOverlap] - Number of characters to overlap between chunks
 * @property {number} [maxParagraphsPerChunk] - Maximum number of paragraphs per chunk
 * @property {number} [paragraphOverlap] - Number of paragraphs to overlap between chunks
 * @property {Array<string>} [separators] - List of separators for recursive chunking
 * @property {number} [minHeadingLevel] - Minimum heading level for heading-based chunking
 */

/**
 * Process a document into chunks with embeddings
 * @param {Object} document - Document object with text and metadata
 * @param {ChunkOptions} options - Chunking options
 * @returns {Promise<Array<Object>>} Array of chunks with text, metadata, and embeddings
 */
export async function chunkDocument(document, options = { strategy: 'character' }) {
  if (!document || !document.text) {
    throw new Error('Invalid document or missing text');
  }
  
  let chunks = [];
  const { text, metadata } = document;
  
  // Apply the specified chunking strategy
  switch (options.strategy) {
    case 'character':
      chunks = splitByCharacterCount(
        text, 
        options.chunkSize || 1000, 
        options.chunkOverlap || 200
      ).map(chunkText => ({
        text: chunkText,
        metadata: { ...metadata, chunkStrategy: 'character' }
      }));
      break;
      
    case 'paragraph':
      chunks = splitByParagraphs(
        text, 
        options.maxParagraphsPerChunk || 3, 
        options.paragraphOverlap || 1
      ).map(chunkText => ({
        text: chunkText,
        metadata: { ...metadata, chunkStrategy: 'paragraph' }
      }));
      break;
      
    case 'recursive':
      chunks = splitRecursively(
        text, 
        options.separators || ['\n\n', '\n', '. ', ' '], 
        options.chunkSize || 1000, 
        options.chunkOverlap || 200
      ).map(chunkText => ({
        text: chunkText,
        metadata: { ...metadata, chunkStrategy: 'recursive' }
      }));
      break;
      
    case 'heading':
      // For heading-based chunking, we get chunks with title and content
      const headingChunks = splitByHeadings(text, options.minHeadingLevel || 1);
      chunks = headingChunks.map(chunk => ({
        text: chunk.content,
        metadata: { 
          ...metadata, 
          chunkStrategy: 'heading',
          title: chunk.title,
          headingLevel: chunk.level
        }
      }));
      break;
      
    default:
      throw new Error(`Unknown chunking strategy: ${options.strategy}`);
  }
  
  // Generate embeddings for all chunks
  const chunksWithEmbeddings = await generateChunkEmbeddingsWithMetadata(chunks);
  
  return chunksWithEmbeddings;
}

/**
 * Process multiple documents into chunks with embeddings
 * @param {Array<Object>} documents - Array of document objects with text and metadata
 * @param {ChunkOptions} options - Chunking options
 * @returns {Promise<Array<Object>>} Array of chunks with text, metadata, and embeddings
 */
export async function chunkDocuments(documents, options = { strategy: 'character' }) {
  if (!documents || !Array.isArray(documents)) {
    throw new Error('Invalid documents input');
  }
  
  const allChunks = [];
  
  for (const document of documents) {
    try {
      const documentChunks = await chunkDocument(document, options);
      allChunks.push(...documentChunks);
    } catch (error) {
      console.error(`Error chunking document: ${error.message}`);
    }
  }
  
  return allChunks;
}
