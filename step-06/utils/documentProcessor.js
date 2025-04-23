/**
 * Document processor
 * Processes documents from various sources
 */

import path from 'path';
import { loadTextFile } from './loaders/textLoader.js';
import { loadMarkdownFile } from './loaders/markdownLoader.js';
import { loadPdfFile } from './loaders/pdfLoader.js';

/**
 * Process a document based on its file type
 * @param {string} filePath - Path to the document
 * @returns {Promise<Object>} Processed document with text and metadata
 */
export async function processDocument(filePath) {
  try {
    const extension = path.extname(filePath).toLowerCase();
    
    // Select appropriate loader based on file extension
    switch (extension) {
      case '.txt':
        return await loadTextFile(filePath);
      case '.md':
        return await loadMarkdownFile(filePath);
      case '.pdf':
        return await loadPdfFile(filePath);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  } catch (error) {
    throw new Error(`Error processing document: ${error.message}`);
  }
}

/**
 * Clean and preprocess document text
 * @param {Object} document - Document object with text and metadata
 * @returns {Object} Processed document with cleaned text
 */
export function cleanDocument(document) {
  if (!document || !document.text) {
    throw new Error('Invalid document or missing text');
  }
  
  let cleanedText = document.text;
  
  // Remove excessive whitespace
  cleanedText = cleanedText.replace(/\s+/g, ' ');
  
  // Remove special characters that might interfere with processing
  cleanedText = cleanedText.replace(/[^\w\s.,?!:;()\[\]{}"'-]/g, ' ');
  
  // Trim leading/trailing whitespace
  cleanedText = cleanedText.trim();
  
  return {
    ...document,
    text: cleanedText
  };
}

/**
 * Process a batch of documents
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {Promise<Array<Object>>} Array of processed documents
 */
export async function processBatch(filePaths) {
  try {
    const processedDocuments = [];
    
    for (const filePath of filePaths) {
      const document = await processDocument(filePath);
      const cleanedDocument = cleanDocument(document);
      processedDocuments.push(cleanedDocument);
    }
    
    return processedDocuments;
  } catch (error) {
    throw new Error(`Error processing document batch: ${error.message}`);
  }
}
