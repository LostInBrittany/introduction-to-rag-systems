/**
 * Load RAGmonsters Dataset
 * 
 * This script loads the RAGmonsters dataset from markdown files,
 * chunks the documents, generates embeddings, and stores everything
 * in the vector database.
 * 
 * It uses the functions defined in the README to process the dataset.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getEmbedding } from './embeddings.js';
import { getDatabase, closeDatabase } from './database.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to RAGmonsters dataset
const RAGMONSTERS_DIR = path.join(__dirname, '../data/ragmonsters');

// Get database connection
const db = getDatabase();

/**
 * Load RAGmonsters data from markdown files
 * @param {string} dirPath - Path to the RAGmonsters directory
 * @returns {Promise<Array<Object>>} Array of monster documents
 */
async function loadRagmonstersData(dirPath) {
  console.log(`Loading RAGmonsters data from ${dirPath}...`);
  
  try {
    // Check if the directory exists
    if (!fs.existsSync(dirPath)) {
      console.error(`RAGmonsters directory not found: ${dirPath}`);
      return [];
    }

    // Get all markdown files
    const files = await fs.promises.readdir(dirPath);
    const markdownFiles = files.filter(file => 
      file.endsWith('.md') && 
      !['README.md', 'LICENSE.md'].includes(file)
    );

    if (markdownFiles.length === 0) {
      console.error('No monster files found in the RAGmonsters directory');
      return [];
    }

    console.log(`Found ${markdownFiles.length} monster files`);

    // Process all files in parallel using Promise.all
    return Promise.all(markdownFiles.map(async (file) => {
      const filePath = path.join(dirPath, file);
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return {
        filename: file,
        content,
        title: file.replace('.md', ''),
        source: `RAGmonsters/${file}`
      };
    }));
  } catch (error) {
    console.error('Error loading RAGmonsters data:', error);
    return [];
  }
}

/**
 * Chunk a monster document into sections based on markdown headers
 * @param {Object} document - The monster document
 * @returns {Array<Object>} Array of chunks
 */
function chunkRagmonstersDocument(document) {
  // Split by markdown headers (##)
  const sections = document.content.split(/^##\s+/m);
  
  // First section is the introduction (after the title)
  const intro = sections[0].replace(/^#\s+.*$/m, '').trim();
  
  const chunks = [];
  
  // Add introduction as a chunk
  chunks.push({
    documentId: document.filename,
    title: document.title,
    source: document.source,
    text: `# ${document.title}\n\n${intro}`
  });
  
  // Process each section
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const sectionLines = section.split('\n');
    const sectionTitle = sectionLines[0].trim();
    const sectionContent = sectionLines.slice(1).join('\n').trim();
    
    chunks.push({
      documentId: document.filename,
      title: document.title,
      source: document.source,
      text: `## ${sectionTitle}\n\n${sectionContent}`
    });
  }
  
  return chunks;
}

/**
 * Generate embeddings for chunks
 * @param {Array<Object>} chunks - The chunks to embed
 * @returns {Promise<Array<Object>>} Chunks with embeddings
 */
async function generateEmbeddingsForChunks(chunks) {
  console.log(`Generating embeddings for ${chunks.length} chunks...`);
  
  const chunksWithEmbeddings = [];
  
  for (const chunk of chunks) {
    try {
      const embedding = await getEmbedding(chunk.text);
      chunksWithEmbeddings.push({
        ...chunk,
        embedding
      });
    } catch (error) {
      console.error(`Error generating embedding for chunk:`, error);
    }
  }
  
  return chunksWithEmbeddings;
}

/**
 * Store RAGmonsters in the database
 * @param {Array<Object>} documents - The monster documents
 * @param {Array<Object>} chunksWithEmbeddings - The chunks with embeddings
 */
async function storeRagmonstersInDb(documents, chunksWithEmbeddings) {
  console.log(`Storing ${documents.length} RAGmonsters documents with ${chunksWithEmbeddings.length} chunks`);
  
  try {
    // Store documents
    for (const doc of documents) {
      const docId = db.prepare(`
        INSERT INTO documents (title, source, filetype)
        VALUES (?, ?, ?)
      `).run(doc.title, doc.source, 'markdown').lastInsertRowid;
      
      // Store chunks with their embeddings
      for (const chunk of chunksWithEmbeddings.filter(c => c.documentId === doc.filename)) {
        db.prepare(`
          INSERT INTO chunks (document_id, text, embedding)
          VALUES (?, ?, ?)
        `).run(docId, chunk.text, Buffer.from(new Float32Array(chunk.embedding).buffer));
      }
    }
    
    console.log(`Stored ${documents.length} RAGmonsters documents with ${chunksWithEmbeddings.length} chunks`);
  } catch (error) {
    console.error('Error storing RAGmonsters in database:', error);
    throw error;
  }
}

/**
 * Main function to load and process RAGmonsters
 */
async function loadAndProcessRagmonsters() {
  console.log('Starting RAGmonsters data processing...');
  
  try {
    // 1. Load monster documents
    const monsters = await loadRagmonstersData(RAGMONSTERS_DIR);
    
    if (monsters.length === 0) {
      console.error('No monsters loaded. Exiting.');
      return;
    }
    
    // 2. Chunk documents
    console.log('Chunking monster documents...');
    let allChunks = [];
    
    for (const monster of monsters) {
      const chunks = chunkRagmonstersDocument(monster);
      allChunks = allChunks.concat(chunks);
    }
    
    console.log(`Created ${allChunks.length} chunks`);
    
    // 3. Generate embeddings
    const chunksWithEmbeddings = await generateEmbeddingsForChunks(allChunks);
    
    // 4. Store in database
    await storeRagmonstersInDb(monsters, chunksWithEmbeddings);
    
    console.log('RAGmonsters data processing complete!');
  } catch (error) {
    console.error('Error in RAGmonsters processing:', error);
  }
}

// Run the script
loadAndProcessRagmonsters().finally(() => {
  // Close database connection
  closeDatabase();
});

// Export functions for testing and reuse
export {
  loadRagmonstersData,
  chunkRagmonstersDocument,
  generateEmbeddingsForChunks,
  storeRagmonstersInDb
};
