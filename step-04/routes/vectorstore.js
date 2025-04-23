/**
 * Vector storage routes
 */

import express from 'express';
import { processDocument } from '../utils/documentProcessor.js';
import { chunkDocument } from '../utils/documentChunker.js';
import { getEmbedding } from '../utils/embeddings.js';
import { 
  storeDocumentWithChunks, 
  findSimilarChunks,
  getAllDocuments,
  getDocumentChunks
} from '../utils/vectorStorage.js';

const router = express.Router();

/**
 * Endpoint to store a document with chunks in the vector database
 * POST /vectorstore/store
 * Body: { 
 *   filePath: '/path/to/file.txt',
 *   options: { 
 *     strategy: 'character', 
 *     chunkSize: 1000, 
 *     chunkOverlap: 200 
 *   }
 * }
 */
router.post('/store', async (req, res) => {
  try {
    const { filePath, options } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ 
        error: 'Invalid request. Please provide a file path.' 
      });
    }
    
    // Process the document
    const document = await processDocument(filePath);
    
    // Chunk the document and generate embeddings
    const chunks = await chunkDocument(document, options || { strategy: 'character' });
    
    // Store document and chunks in the vector database
    const result = storeDocumentWithChunks(document, chunks);
    
    // Return the result
    res.json({
      success: true,
      documentId: result.documentId,
      chunkCount: chunks.length
    });
  } catch (error) {
    console.error('Error storing document:', error);
    res.status(500).json({ 
      error: 'Failed to store document',
      message: error.message
    });
  }
});

/**
 * Endpoint to search for similar chunks
 * POST /vectorstore/search
 * Body: { 
 *   query: 'search query text',
 *   limit: 5,
 *   threshold: 0.7
 * }
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 5, threshold = 0.7 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Invalid request. Please provide a query.' 
      });
    }
    
    // Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);
    
    // Find similar chunks
    const similarChunks = findSimilarChunks(
      queryEmbedding, 
      parseInt(limit), 
      parseFloat(threshold)
    );
    
    // Return the results
    res.json({
      success: true,
      query,
      count: similarChunks.length,
      results: similarChunks
    });
  } catch (error) {
    console.error('Error searching for similar chunks:', error);
    res.status(500).json({ 
      error: 'Failed to search for similar chunks',
      message: error.message
    });
  }
});

/**
 * Endpoint to get all documents
 * GET /vectorstore/documents
 */
router.get('/documents', (req, res) => {
  try {
    const documents = getAllDocuments();
    
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ 
      error: 'Failed to get documents',
      message: error.message
    });
  }
});

/**
 * Endpoint to get chunks for a document
 * GET /vectorstore/documents/:id/chunks
 */
router.get('/documents/:id/chunks', (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    if (isNaN(documentId)) {
      return res.status(400).json({ 
        error: 'Invalid document ID.' 
      });
    }
    
    const chunks = getDocumentChunks(documentId);
    
    res.json({
      success: true,
      documentId,
      count: chunks.length,
      chunks
    });
  } catch (error) {
    console.error('Error getting document chunks:', error);
    res.status(500).json({ 
      error: 'Failed to get document chunks',
      message: error.message
    });
  }
});

export default router;
