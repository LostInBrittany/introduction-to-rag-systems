/**
 * RAG API routes
 * Provides endpoints for the RAG system
 */

import express from 'express';
import { processQuery, getDocumentInfo } from '../utils/ragPipeline.js';
import { getEmbedding } from '../utils/embeddings.js';
import { retrieveTopK } from '../utils/retrieval.js';

const router = express.Router();

/**
 * Process a query through the RAG pipeline
 * POST /rag/query
 */
router.post('/query', async (req, res) => {
  try {
    const { query, k, options } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string',
        success: false
      });
    }
    
    // Process the query through the RAG pipeline
    const result = await processQuery(query, {
      k: k || 3,
      llmOptions: options || {}
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

/**
 * Retrieve chunks similar to a query
 * POST /rag/retrieve
 */
router.post('/retrieve', async (req, res) => {
  try {
    const { query, k } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string',
        success: false
      });
    }
    
    // Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);
    
    // Retrieve relevant chunks
    const chunks = retrieveTopK(queryEmbedding, k || 3);
    
    res.json({
      chunks,
      success: true
    });
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

/**
 * Get information about a document
 * GET /rag/document/:id
 */
router.get('/document/:id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      return res.status(400).json({
        error: 'Document ID must be a number',
        success: false
      });
    }
    
    const result = await getDocumentInfo(documentId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error getting document info:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

export default router;
