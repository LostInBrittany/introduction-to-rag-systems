/**
 * RAG Pipeline
 * Implements the complete Retrieval-Augmented Generation pipeline
 */

import { getEmbedding } from './embeddings.js';
import { retrieveTopK } from './retrieval.js';
import { createRagPrompt, createNoContextPrompt } from './promptBuilder.js';
import { generateLlmResponse } from './llm.js';

/**
 * Process a user query through the RAG pipeline
 * @param {string} query - The user's question
 * @param {Object} options - Additional options for the pipeline
 * @returns {Promise<Object>} The LLM's response and retrieved chunks
 */
export async function processQuery(query, options = {}) {
  try {
    // 1. Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);
    
    // 2. Retrieve relevant chunks
    const k = options.k || 3;
    const relevantChunks = retrieveTopK(queryEmbedding, k);
    
    // 3. Check if we found any relevant chunks
    if (relevantChunks.length === 0) {
      // Handle the case where no relevant chunks were found
      const noContextPrompt = createNoContextPrompt(query);
      const response = await generateLlmResponse(noContextPrompt);
      
      return {
        answer: response,
        chunks: [],
        success: true
      };
    }
    
    // 4. Create the RAG prompt
    const prompt = createRagPrompt(relevantChunks, query);
    
    // 5. Generate response from LLM
    const response = await generateLlmResponse(prompt, options.llmOptions);
    
    // 6. Return the response and the chunks used
    return {
      answer: response,
      chunks: relevantChunks,
      success: true
    };
  } catch (error) {
    console.error('Error in RAG pipeline:', error);
    return {
      answer: 'Sorry, I encountered an error while processing your question.',
      error: error.message,
      success: false
    };
  }
}

/**
 * Get information about a document from the chunks
 * @param {number} documentId - ID of the document to get information about
 * @returns {Promise<Object>} Document information
 */
export async function getDocumentInfo(documentId) {
  try {
    const { getDatabase } = await import('./database.js');
    const db = getDatabase();
    
    // Get document information
    const document = db.prepare(`
      SELECT id, title, source, filetype, created, modified, metadata
      FROM documents
      WHERE id = ?
    `).get(documentId);
    
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Get chunks for this document
    const chunks = db.prepare(`
      SELECT id, content
      FROM chunks
      WHERE document_id = ?
    `).all(documentId);
    
    return {
      document: {
        id: document.id,
        title: document.title,
        source: document.source,
        filetype: document.filetype,
        created: document.created,
        modified: document.modified,
        metadata: JSON.parse(document.metadata || '{}')
      },
      chunks: chunks.map(chunk => ({
        id: chunk.id,
        text: chunk.content
      })),
      chunkCount: chunks.length,
      success: true
    };
  } catch (error) {
    console.error('Error getting document info:', error);
    return {
      error: error.message,
      success: false
    };
  }
}
