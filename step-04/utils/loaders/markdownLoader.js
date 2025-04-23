/**
 * Markdown document loader
 * Loads and processes markdown files
 */

import fs from 'fs';
import path from 'path';

/**
 * Load a markdown file and return its contents with metadata
 * @param {string} filePath - Path to the markdown file
 * @returns {Promise<Object>} Document object with text and metadata
 */
export async function loadMarkdownFile(filePath) {
  try {
    // Read the file
    const text = await fs.promises.readFile(filePath, 'utf8');
    
    // Extract metadata
    const stats = await fs.promises.stat(filePath);
    const fileName = path.basename(filePath);
    
    // Extract title from markdown (first heading)
    let title = fileName;
    const titleMatch = text.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    // Create document object
    return {
      text,
      metadata: {
        source: filePath,
        filename: fileName,
        filetype: 'markdown',
        title: title,
        created: stats.birthtime,
        modified: stats.mtime,
        size: stats.size
      }
    };
  } catch (error) {
    throw new Error(`Error loading markdown file: ${error.message}`);
  }
}
