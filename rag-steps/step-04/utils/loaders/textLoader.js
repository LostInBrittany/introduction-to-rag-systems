/**
 * Text document loader
 * Loads and processes plain text files
 */

import fs from 'fs';
import path from 'path';

/**
 * Load a text file and return its contents with metadata
 * @param {string} filePath - Path to the text file
 * @returns {Promise<Object>} Document object with text and metadata
 */
export async function loadTextFile(filePath) {
  try {
    // Read the file
    const text = await fs.promises.readFile(filePath, 'utf8');
    
    // Extract metadata
    const stats = await fs.promises.stat(filePath);
    const fileName = path.basename(filePath);
    
    // Create document object
    return {
      text,
      metadata: {
        source: filePath,
        filename: fileName,
        filetype: 'text',
        created: stats.birthtime,
        modified: stats.mtime,
        size: stats.size
      }
    };
  } catch (error) {
    throw new Error(`Error loading text file: ${error.message}`);
  }
}
