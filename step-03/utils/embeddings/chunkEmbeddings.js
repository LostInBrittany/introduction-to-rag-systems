/**
 * Chunk embedding utilities
 * Generates embeddings for text chunks
 */

import { getEmbedding } from '../embeddings.js';

/**
 * Generate embeddings for an array of text chunks
 * @param {Array<string>} chunks - Array of text chunks
 * @returns {Promise<Array<Object>>} Array of objects with chunk text and embedding
 */
export async function generateChunkEmbeddings(chunks) {
  if (!chunks || !Array.isArray(chunks)) {
    throw new Error('Invalid chunks input');
  }
  
  const results = [];
  
  for (const chunk of chunks) {
    try {
      const embedding = await getEmbedding(chunk);
      results.push({
        text: chunk,
        embedding
      });
    } catch (error) {
      console.error(`Error generating embedding for chunk: ${error.message}`);
      // Add the chunk without embedding so we don't lose the text
      results.push({
        text: chunk,
        embedding: null,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Generate embeddings for an array of chunks with metadata
 * @param {Array<Object>} chunks - Array of chunk objects with text and metadata
 * @param {string} textField - Name of the field containing the text to embed
 * @returns {Promise<Array<Object>>} Array of objects with chunk data and embedding
 */
export async function generateChunkEmbeddingsWithMetadata(chunks, textField = 'text') {
  if (!chunks || !Array.isArray(chunks)) {
    throw new Error('Invalid chunks input');
  }
  
  const results = [];
  
  for (const chunk of chunks) {
    try {
      if (!chunk[textField]) {
        throw new Error(`Chunk is missing the specified text field: ${textField}`);
      }
      
      const embedding = await getEmbedding(chunk[textField]);
      
      // Create a new object with all original properties plus the embedding
      results.push({
        ...chunk,
        embedding
      });
    } catch (error) {
      console.error(`Error generating embedding for chunk: ${error.message}`);
      // Add the chunk without embedding so we don't lose the data
      results.push({
        ...chunk,
        embedding: null,
        error: error.message
      });
    }
  }
  
  return results;
}
