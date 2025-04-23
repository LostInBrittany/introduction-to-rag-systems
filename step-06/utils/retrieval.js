/**
 * Retrieval utilities for the RAG pipeline
 * Implements vector similarity search and top-K retrieval
 */

import { getDatabase } from './database.js';

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vectorA - First vector
 * @param {Array<number>} vectorB - Second vector
 * @returns {number} Cosine similarity (between -1 and 1, higher is more similar)
 */
export function cosineSimilarity(vectorA, vectorB) {
  // Validate inputs with detailed error messages
  if (!vectorA) {
    console.error('First vector is undefined or null');
    return 0;
  }
  if (!vectorB) {
    console.error('Second vector is undefined or null');
    return 0;
  }
  
  // Convert to arrays if they're not already
  const vecA = Array.isArray(vectorA) ? vectorA : Array.from(vectorA);
  const vecB = Array.isArray(vectorB) ? vectorB : Array.from(vectorB);
  
  // Check vector lengths
  if (vecA.length !== vecB.length) {
    console.error(`Vector length mismatch: ${vecA.length} vs ${vecB.length}`);
    return 0;
  }
  
  // Check if vectors contain valid numbers
  if (vecA.some(v => typeof v !== 'number' || isNaN(v)) || 
      vecB.some(v => typeof v !== 'number' || isNaN(v))) {
    console.error('Vectors contain non-numeric values');
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0; // Handle zero vectors
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve the top K most similar chunks to a query embedding
 * @param {Array<number>} queryEmbedding - The embedding of the query
 * @param {number} k - The number of chunks to retrieve (default: 3)
 * @returns {Array<Object>} The most similar chunks with their similarity scores
 */
export function retrieveTopK(queryEmbedding, k = 3) {
  if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
    throw new Error('Invalid query embedding');
  }

  const db = getDatabase();
  
  // Get all chunks from the database
  const stmt = db.prepare(`
    SELECT 
      c.id, 
      c.document_id, 
      c.text, 
      c.embedding, 
      d.title, 
      d.source
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
  `);
  
  const chunks = stmt.all();
  
  // Calculate similarity for each chunk
  const chunksWithSimilarity = chunks.map(chunk => {
    // Handle binary embeddings stored in the database
    let embedding;
    
    if (chunk.embedding) {
      if (typeof chunk.embedding === 'string') {
        // Try to parse as JSON string
        try {
          embedding = JSON.parse(chunk.embedding);
        } catch (error) {
          console.error('Unable to parse embedding as JSON:', error);
          return null; // Skip this chunk
        }
      } else {
        // Handle binary data (BLOB)
        try {
          // Convert BLOB to Float32Array
          const embeddingBuffer = Buffer.from(chunk.embedding);
          embedding = new Float32Array(embeddingBuffer.buffer, embeddingBuffer.byteOffset, embeddingBuffer.byteLength / 4);
          
          // Convert to regular array for consistent handling
          embedding = Array.from(embedding);
        } catch (error) {
          console.error('Unable to parse binary embedding:', error);
          return null; // Skip this chunk
        }
      }
    } else {
      console.error('Embedding is missing');
      return null; // Skip this chunk
    }
    
    // Calculate similarity between query and chunk
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    
    return {
      id: chunk.id,
      documentId: chunk.document_id,
      text: chunk.text,
      title: chunk.title,
      source: chunk.source,
      similarity
    };
  });
  
  // Filter out null values, sort by similarity (descending) and take top K
  return chunksWithSimilarity
    .filter(chunk => chunk !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/**
 * Find similar chunks to a query
 * @param {Array<number>} queryEmbedding - The embedding of the query
 * @param {number} limit - Maximum number of chunks to return
 * @returns {Array<Object>} The most similar chunks
 */
export function findSimilarChunks(queryEmbedding, limit = 3) {
  return retrieveTopK(queryEmbedding, limit);
}
