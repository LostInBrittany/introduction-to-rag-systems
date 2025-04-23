/**
 * Document chunking routes
 */

import express from 'express';
import { processDocument } from '../utils/documentProcessor.js';
import { chunkDocument, chunkDocuments } from '../utils/documentChunker.js';

const router = express.Router();

/**
 * Endpoint to chunk a document
 * POST /chunking/document
 * Body: { 
 *   filePath: '/path/to/file.txt',
 *   options: { 
 *     strategy: 'character', 
 *     chunkSize: 1000, 
 *     chunkOverlap: 200 
 *   }
 * }
 */
router.post('/document', async (req, res) => {
  try {
    const { filePath, options } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ 
        error: 'Invalid request. Please provide a file path.' 
      });
    }
    
    // Process the document
    const document = await processDocument(filePath);
    
    // Chunk the document
    const chunks = await chunkDocument(document, options || { strategy: 'character' });
    
    // Return the chunks
    res.json({
      success: true,
      count: chunks.length,
      chunks: chunks
    });
  } catch (error) {
    console.error('Error chunking document:', error);
    res.status(500).json({ 
      error: 'Failed to chunk document',
      message: error.message
    });
  }
});

/**
 * Endpoint to chunk multiple documents
 * POST /chunking/batch
 * Body: { 
 *   filePaths: ['/path/to/file1.txt', '/path/to/file2.pdf'],
 *   options: { 
 *     strategy: 'paragraph', 
 *     maxParagraphsPerChunk: 3 
 *   }
 * }
 */
router.post('/batch', async (req, res) => {
  try {
    const { filePaths, options } = req.body;
    
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Please provide an array of file paths.' 
      });
    }
    
    // Process all documents
    const documents = [];
    for (const filePath of filePaths) {
      try {
        const document = await processDocument(filePath);
        documents.push(document);
      } catch (error) {
        console.error(`Error processing document ${filePath}:`, error);
      }
    }
    
    // Chunk all documents
    const chunks = await chunkDocuments(documents, options || { strategy: 'character' });
    
    // Return the chunks
    res.json({
      success: true,
      count: chunks.length,
      chunks: chunks
    });
  } catch (error) {
    console.error('Error chunking documents:', error);
    res.status(500).json({ 
      error: 'Failed to chunk documents',
      message: error.message
    });
  }
});

export default router;
