/**
 * Document ingestion routes
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processBatch } from '../utils/documentProcessor.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Endpoint to ingest documents from local file system
 * POST /ingest/local
 * Body: { paths: ['/path/to/file1.txt', '/path/to/file2.pdf'] }
 */
router.post('/local', async (req, res) => {
  try {
    const { paths } = req.body;
    
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Please provide an array of file paths.' 
      });
    }
    
    // Process documents
    const processedDocuments = await processBatch(paths);
    
    // Return processed documents
    res.json({
      success: true,
      count: processedDocuments.length,
      documents: processedDocuments
    });
  } catch (error) {
    console.error('Error ingesting documents:', error);
    res.status(500).json({ 
      error: 'Failed to ingest documents',
      message: error.message
    });
  }
});

export default router;
