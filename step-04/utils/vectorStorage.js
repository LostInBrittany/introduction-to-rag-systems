/**
 * Vector storage utility
 * Stores and retrieves document chunks with embeddings
 */

import { getDatabase, closeDatabase } from './database.js';

/**
 * Store a document in the database
 * @param {Object} document - Document object with metadata
 * @returns {number} Document ID
 */
export function storeDocument(document) {
  const db = getDatabase();
  
  const { source, metadata } = document;
  
  const stmt = db.prepare(`
    INSERT INTO documents (source, title, filetype)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(
    source || metadata.source || '',
    metadata.title || metadata.filename || '',
    metadata.filetype || ''
  );
  
  return result.lastInsertRowid;
}

/**
 * Store a chunk with its embedding in the database
 * @param {Object} chunk - Chunk object with text, metadata, and embedding
 * @param {number} documentId - ID of the parent document
 * @param {number} chunkIndex - Index of the chunk in the document
 * @returns {number} Chunk ID
 */
export function storeChunk(chunk, documentId, chunkIndex) {
  const db = getDatabase();
  
  const { text, metadata, embedding } = chunk;
  
  // Use the embedding directly if it exists
  const embeddingFloat32 = embedding ? new Float32Array(embedding) : null;
  
  const stmt = db.prepare(`
    INSERT INTO chunks (document_id, text, chunk_index, chunk_strategy, embedding)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    documentId,
    text,
    chunkIndex,
    metadata.chunkStrategy || 'unknown',
    embeddingFloat32
  );
  
  return result.lastInsertRowid;
}

/**
 * Store a document with all its chunks
 * @param {Object} document - Document object with text and metadata
 * @param {Array<Object>} chunks - Array of chunks with text, metadata, and embeddings
 * @returns {Object} Result with document ID and chunk IDs
 */
export function storeDocumentWithChunks(document, chunks) {
  const db = getDatabase();
  
  // Start transaction
  const transaction = db.transaction((document, chunks) => {
    // Store document
    const documentId = storeDocument(document);
    
    // Store chunks
    const chunkIds = [];
    chunks.forEach((chunk, index) => {
      const chunkId = storeChunk(chunk, documentId, index);
      chunkIds.push(chunkId);
    });
    
    return {
      documentId,
      chunkIds
    };
  });
  
  // Execute transaction
  return transaction(document, chunks);
}

/**
 * Calculate cosine similarity between two embeddings
 * @param {Float32Array} embedding1 - First embedding
 * @param {Float32Array} embedding2 - Second embedding
 * @returns {number} Cosine similarity score (between -1 and 1)
 */
function calculateCosineSimilarity(embedding1, embedding2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (norm1 * norm2);
}

/**
 * Find similar chunks for a query embedding
 * @param {Array<number>} queryEmbedding - Query embedding vector
 * @param {number} limit - Maximum number of results to return
 * @param {number} similarityThreshold - Minimum similarity score (0-1)
 * @returns {Array<Object>} Array of chunks with similarity scores
 */
export function findSimilarChunks(queryEmbedding, limit = 5, similarityThreshold = 0.7) {
  const db = getDatabase();
  
  // Get all chunks with their embeddings
  const stmt = db.prepare(`
    SELECT 
      c.id,
      c.text,
      c.chunk_strategy,
      c.embedding,
      d.source,
      d.title,
      d.filetype
    FROM 
      chunks c
    JOIN 
      documents d ON c.document_id = d.id
    WHERE 
      c.embedding IS NOT NULL
  `);
  
  const chunks = stmt.all();
  
  // Calculate similarity for each chunk
  const queryEmbeddingArray = new Float32Array(queryEmbedding);
  const chunksWithSimilarity = chunks.map(chunk => {
    // Convert BLOB to Float32Array
    const embeddingBuffer = Buffer.from(chunk.embedding);
    const embeddingArray = new Float32Array(embeddingBuffer.buffer, embeddingBuffer.byteOffset, embeddingBuffer.byteLength / 4);
    
    // Calculate similarity
    const similarity = calculateCosineSimilarity(queryEmbeddingArray, embeddingArray);
    
    return {
      id: chunk.id,
      text: chunk.text,
      source: chunk.source,
      title: chunk.title,
      filetype: chunk.filetype,
      chunkStrategy: chunk.chunk_strategy,
      similarity
    };
  });
  
  // Filter and sort by similarity
  return chunksWithSimilarity
    .filter(chunk => chunk.similarity >= similarityThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Get all documents in the database
 * @returns {Array<Object>} Array of documents
 */
export function getAllDocuments() {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT 
      id,
      source,
      title,
      filetype,
      created_at,
      (SELECT COUNT(*) FROM chunks WHERE document_id = documents.id) AS chunk_count
    FROM 
      documents
    ORDER BY 
      created_at DESC
  `);
  
  return stmt.all();
}

/**
 * Get all chunks for a document
 * @param {number} documentId - Document ID
 * @returns {Array<Object>} Array of chunks
 */
export function getDocumentChunks(documentId) {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT 
      id,
      text,
      chunk_index,
      chunk_strategy,
      created_at
    FROM 
      chunks
    WHERE 
      document_id = ?
    ORDER BY 
      chunk_index
  `);
  
  return stmt.all(documentId);
}

// Re-export closeDatabase from database.js
export { closeDatabase };
