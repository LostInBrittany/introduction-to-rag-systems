/**
 * PDF document loader
 * Loads and processes PDF files
 */

import fs from 'fs';
import path from 'path';

// Import pdf-parse with a custom configuration to avoid loading test files
let pdfParse;
try {
  // We're using a dynamic import with a try-catch to handle any initialization errors
  const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
  pdfParse = pdfParseModule.default;
} catch (error) {
  console.error('Error loading pdf-parse module:', error);
  // Provide a fallback function that returns an error
  pdfParse = () => Promise.reject(new Error('PDF parsing is not available'));
}

/**
 * Load a PDF file and return its contents with metadata
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} Document object with text and metadata
 */
export async function loadPdfFile(filePath) {
  try {
    // Read the file
    const dataBuffer = await fs.promises.readFile(filePath);
    
    // Parse PDF
    const pdfData = await pdfParse(dataBuffer);
    
    // Extract metadata
    const stats = await fs.promises.stat(filePath);
    const fileName = path.basename(filePath);
    
    // Create document object
    return {
      text: pdfData.text,
      metadata: {
        source: filePath,
        filename: fileName,
        filetype: 'pdf',
        title: pdfData.info?.Title || fileName,
        author: pdfData.info?.Author || 'Unknown',
        created: stats.birthtime,
        modified: stats.mtime,
        size: stats.size,
        pages: pdfData.numpages
      }
    };
  } catch (error) {
    throw new Error(`Error loading PDF file: ${error.message}`);
  }
}
