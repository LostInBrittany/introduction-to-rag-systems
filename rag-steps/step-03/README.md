# 📚 Step 3: Document Chunking and Embedding

In this step, we'll implement two critical components of the RAG pipeline: document chunking and embedding generation. These processes transform our ingested documents into a format that can be efficiently stored and retrieved from a vector database.

## 🎯 Learning Objectives
- Implement various document chunking strategies
- Generate vector embeddings for text chunks
- Understand the importance of chunking in RAG systems
- Learn how to optimize chunking and embedding for better retrieval

## 🧩 Document Chunking and Embedding Overview

After ingesting documents in Step 2, we need to:

1. **Split documents into smaller chunks** that are appropriate for embedding and retrieval
2. **Generate vector embeddings** for each chunk to capture its semantic meaning
3. **Prepare these embeddings** for storage in a vector database (coming in Step 4)

![Vector DB creation pipeline](https://images.ctfassets.net/xjan103pcp94/3q5HUANQ4kS0V23cgEP0JF/ef3b62c5bc5c5c11b734fd3b73f6ea28/image3.png)

*Figure: Vector DB creation pipeline showing the flow from raw documents to processed text, then chunking and embedding. (Source: [Anyscale – Building RAG-based LLM Applications](https://www.anyscale.com/blog/a-comprehensive-guide-for-building-rag-based-llm-applications-part-1))*

## 🧩 Why Chunking Matters

Chunking is a critical step in the RAG pipeline for several reasons:

1. **Context Window Limitations**: LLMs have limited context windows. Proper chunking ensures that retrieved content fits within these constraints.

2. **Retrieval Granularity**: Smaller chunks allow for more precise retrieval of relevant information.

3. **Semantic Coherence**: Good chunking preserves the semantic meaning of content, ensuring that related information stays together.

4. **Embedding Quality**: The quality of embeddings depends on the quality of chunks. Well-formed chunks lead to better embeddings and more accurate retrieval.

## 📋 Prerequisites

Before starting this step, make sure you've completed:
- [Step 1: Project Setup](../step-01/README.md)
- [Step 2: Document Ingestion](../step-02/README.md)

You should have a working environment with:
- Node.js and npm installed
- Express.js server set up
- Document ingestion pipeline functioning

## 🛠️ Implementation Steps

### 1. Create Chunking Utilities

First, let's create a directory for our chunking utilities:

```bash
mkdir -p utils/chunking
```

#### Simple Text Chunker

Create a file `utils/chunking/simpleChunker.js`:

```javascript
/**
 * Simple text chunker
 * Splits text into chunks based on character count
 */

/**
 * Split text into chunks of approximately the specified size
 * @param {string} text - Text to split into chunks
 * @param {number} chunkSize - Target size of each chunk in characters
 * @param {number} chunkOverlap - Number of characters to overlap between chunks
 * @returns {Array<string>} Array of text chunks
 */
export function splitByCharacterCount(text, chunkSize = 1000, chunkOverlap = 200) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  if (text.length <= chunkSize) {
    return [text];
  }
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = startIndex + chunkSize;
    
    // If we're not at the end of the text, try to find a good break point
    if (endIndex < text.length) {
      // Look for a period, question mark, or exclamation mark followed by a space
      const periodIndex = text.indexOf('. ', endIndex - 100);
      const questionIndex = text.indexOf('? ', endIndex - 100);
      const exclamationIndex = text.indexOf('! ', endIndex - 100);
      
      // Find the closest sentence boundary after endIndex - 100
      const sentenceEndIndices = [periodIndex, questionIndex, exclamationIndex]
        .filter(index => index !== -1 && index < endIndex)
        .sort((a, b) => Math.abs(a - endIndex) - Math.abs(b - endIndex));
      
      if (sentenceEndIndices.length > 0) {
        // Use the closest sentence boundary
        endIndex = sentenceEndIndices[0] + 2; // +2 to include the punctuation and space
      } else {
        // If no sentence boundary found, look for a space
        const spaceIndex = text.lastIndexOf(' ', endIndex);
        if (spaceIndex !== -1 && spaceIndex > startIndex) {
          endIndex = spaceIndex + 1; // +1 to include the space
        }
      }
    }
    
    // Extract the chunk
    chunks.push(text.substring(startIndex, endIndex).trim());
    
    // Move to the next chunk, accounting for overlap
    startIndex = endIndex - chunkOverlap;
  }
  
  return chunks;
}

/**
 * Split text into chunks based on paragraphs
 * @param {string} text - Text to split into chunks
 * @param {number} maxParagraphsPerChunk - Maximum number of paragraphs per chunk
 * @param {number} paragraphOverlap - Number of paragraphs to overlap between chunks
 * @returns {Array<string>} Array of text chunks
 */
export function splitByParagraphs(text, maxParagraphsPerChunk = 3, paragraphOverlap = 1) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  // Split text into paragraphs (double newlines or more)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length <= maxParagraphsPerChunk) {
    return [text];
  }
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < paragraphs.length) {
    // Calculate end index for this chunk
    const endIndex = Math.min(startIndex + maxParagraphsPerChunk, paragraphs.length);
    
    // Extract the paragraphs for this chunk
    const chunkParagraphs = paragraphs.slice(startIndex, endIndex);
    
    // Join paragraphs and add to chunks
    chunks.push(chunkParagraphs.join('\n\n'));
    
    // Move to the next chunk, accounting for overlap
    startIndex = endIndex - paragraphOverlap;
  }
  
  return chunks;
}
```

#### Recursive Text Chunker

Create a file `utils/chunking/recursiveChunker.js`:

```javascript
/**
 * Recursive text chunker
 * Splits text hierarchically based on different separators
 */

/**
 * Split text recursively using a list of separators
 * @param {string} text - Text to split into chunks
 * @param {Array<string>} separators - List of separators to use for splitting (in order)
 * @param {number} chunkSize - Target size of each chunk in characters
 * @param {number} chunkOverlap - Number of characters to overlap between chunks
 * @returns {Array<string>} Array of text chunks
 */
export function splitRecursively(text, separators = ['\n\n', '\n', '. ', ' '], chunkSize = 1000, chunkOverlap = 200) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  // Base case: if text is smaller than chunk size or we've run out of separators
  if (text.length <= chunkSize || separators.length === 0) {
    return [text];
  }
  
  const chunks = [];
  const currentSeparator = separators[0];
  const remainingSeparators = separators.slice(1);
  
  // Split text by current separator
  const segments = text.split(currentSeparator);
  
  let currentChunk = '';
  
  for (const segment of segments) {
    // If adding this segment would exceed chunk size
    if ((currentChunk + segment).length > chunkSize && currentChunk.length > 0) {
      // Add current chunk to chunks array
      chunks.push(currentChunk.trim());
      
      // Start a new chunk with overlap
      const overlapSize = Math.min(chunkOverlap, currentChunk.length);
      currentChunk = currentChunk.substring(currentChunk.length - overlapSize) + currentSeparator + segment;
    } else {
      // Add segment to current chunk
      if (currentChunk.length > 0) {
        currentChunk += currentSeparator;
      }
      currentChunk += segment;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // If chunks are still too large, recursively split them using the next separator
  if (remainingSeparators.length > 0) {
    return chunks.flatMap(chunk => 
      chunk.length > chunkSize 
        ? splitRecursively(chunk, remainingSeparators, chunkSize, chunkOverlap)
        : [chunk]
    );
  }
  
  return chunks;
}

/**
 * Split text by headings (useful for markdown documents)
 * @param {string} text - Text to split into chunks
 * @param {number} minHeadingLevel - Minimum heading level to split on (1 for #, 2 for ##, etc.)
 * @returns {Array<Object>} Array of chunks with heading and content
 */
export function splitByHeadings(text, minHeadingLevel = 1) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  // Create regex to match headings of specified level or higher
  const headingRegex = new RegExp(`^#{${minHeadingLevel},6}\\s+(.+)$`, 'gm');
  
  // Find all heading positions
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(text)) !== null) {
    headings.push({
      index: match.index,
      title: match[0].trim(),
      level: match[0].indexOf(' ')  // Number of # characters
    });
  }
  
  if (headings.length === 0) {
    return [{
      title: 'Text',
      content: text,
      level: 0
    }];
  }
  
  // Create chunks based on headings
  const chunks = [];
  
  // Add text before first heading if it exists
  if (headings[0].index > 0) {
    chunks.push({
      title: 'Introduction',
      content: text.substring(0, headings[0].index).trim(),
      level: 0
    });
  }
  
  // Add chunks for each heading
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextIndex = (i < headings.length - 1) ? headings[i + 1].index : text.length;
    
    chunks.push({
      title: heading.title.replace(/^#+\s+/, ''),  // Remove # symbols
      content: text.substring(heading.index, nextIndex).trim(),
      level: heading.level
    });
  }
  
  return chunks;
}
```

### 2. Create Embedding Utilities

Now, let's create utilities for generating embeddings for our chunks:

Create a file `utils/embeddings/chunkEmbeddings.js`:

```javascript
/**
 * Chunk embedding utilities
 * Generates embeddings for text chunks
 */

import { getEmbedding } from '../embeddings.js';

/**
 * Generate embeddings for an array of text chunks
 * @param {Array<string>} chunks - Array of text chunks
 * @returns {Promise<Array<Object>>} Array of objects with chunk text and embedding
 */
export async function generateChunkEmbeddings(chunks) {
  if (!chunks || !Array.isArray(chunks)) {
    throw new Error('Invalid chunks input');
  }
  
  const results = [];
  
  for (const chunk of chunks) {
    try {
      const embedding = await getEmbedding(chunk);
      results.push({
        text: chunk,
        embedding
      });
    } catch (error) {
      console.error(`Error generating embedding for chunk: ${error.message}`);
      // Add the chunk without embedding so we don't lose the text
      results.push({
        text: chunk,
        embedding: null,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Generate embeddings for an array of chunks with metadata
 * @param {Array<Object>} chunks - Array of chunk objects with text and metadata
 * @param {string} textField - Name of the field containing the text to embed
 * @returns {Promise<Array<Object>>} Array of objects with chunk data and embedding
 */
export async function generateChunkEmbeddingsWithMetadata(chunks, textField = 'text') {
  if (!chunks || !Array.isArray(chunks)) {
    throw new Error('Invalid chunks input');
  }
  
  const results = [];
  
  for (const chunk of chunks) {
    try {
      if (!chunk[textField]) {
        throw new Error(`Chunk is missing the specified text field: ${textField}`);
      }
      
      const embedding = await getEmbedding(chunk[textField]);
      
      // Create a new object with all original properties plus the embedding
      results.push({
        ...chunk,
        embedding
      });
    } catch (error) {
      console.error(`Error generating embedding for chunk: ${error.message}`);
      // Add the chunk without embedding so we don't lose the data
      results.push({
        ...chunk,
        embedding: null,
        error: error.message
      });
    }
  }
  
  return results;
}
```

### 3. Create Document Chunking Module

Now, let's create a module that combines our document processor with chunking and embedding:

Create a file `utils/documentChunker.js`:

```javascript
/**
 * Document chunker
 * Processes documents into chunks with embeddings
 */

import { splitByCharacterCount, splitByParagraphs } from './chunking/simpleChunker.js';
import { splitRecursively, splitByHeadings } from './chunking/recursiveChunker.js';
import { generateChunkEmbeddings, generateChunkEmbeddingsWithMetadata } from './embeddings/chunkEmbeddings.js';

/**
 * Chunk options for different strategies
 * @typedef {Object} ChunkOptions
 * @property {string} strategy - Chunking strategy to use
 * @property {number} [chunkSize] - Target size of each chunk in characters
 * @property {number} [chunkOverlap] - Number of characters to overlap between chunks
 * @property {number} [maxParagraphsPerChunk] - Maximum number of paragraphs per chunk
 * @property {number} [paragraphOverlap] - Number of paragraphs to overlap between chunks
 * @property {Array<string>} [separators] - List of separators for recursive chunking
 * @property {number} [minHeadingLevel] - Minimum heading level for heading-based chunking
 */

/**
 * Process a document into chunks with embeddings
 * @param {Object} document - Document object with text and metadata
 * @param {ChunkOptions} options - Chunking options
 * @returns {Promise<Array<Object>>} Array of chunks with text, metadata, and embeddings
 */
export async function chunkDocument(document, options = { strategy: 'character' }) {
  if (!document || !document.text) {
    throw new Error('Invalid document or missing text');
  }
  
  let chunks = [];
  const { text, metadata } = document;
  
  // Apply the specified chunking strategy
  switch (options.strategy) {
    case 'character':
      chunks = splitByCharacterCount(
        text, 
        options.chunkSize || 1000, 
        options.chunkOverlap || 200
      ).map(chunkText => ({
        text: chunkText,
        metadata: { ...metadata, chunkStrategy: 'character' }
      }));
      break;
      
    case 'paragraph':
      chunks = splitByParagraphs(
        text, 
        options.maxParagraphsPerChunk || 3, 
        options.paragraphOverlap || 1
      ).map(chunkText => ({
        text: chunkText,
        metadata: { ...metadata, chunkStrategy: 'paragraph' }
      }));
      break;
      
    case 'recursive':
      chunks = splitRecursively(
        text, 
        options.separators || ['\n\n', '\n', '. ', ' '], 
        options.chunkSize || 1000, 
        options.chunkOverlap || 200
      ).map(chunkText => ({
        text: chunkText,
        metadata: { ...metadata, chunkStrategy: 'recursive' }
      }));
      break;
      
    case 'heading':
      // For heading-based chunking, we get chunks with title and content
      const headingChunks = splitByHeadings(text, options.minHeadingLevel || 1);
      chunks = headingChunks.map(chunk => ({
        text: chunk.content,
        metadata: { 
          ...metadata, 
          chunkStrategy: 'heading',
          title: chunk.title,
          headingLevel: chunk.level
        }
      }));
      break;
      
    default:
      throw new Error(`Unknown chunking strategy: ${options.strategy}`);
  }
  
  // Generate embeddings for all chunks
  const chunksWithEmbeddings = await generateChunkEmbeddingsWithMetadata(chunks);
  
  return chunksWithEmbeddings;
}

/**
 * Process multiple documents into chunks with embeddings
 * @param {Array<Object>} documents - Array of document objects with text and metadata
 * @param {ChunkOptions} options - Chunking options
 * @returns {Promise<Array<Object>>} Array of chunks with text, metadata, and embeddings
 */
export async function chunkDocuments(documents, options = { strategy: 'character' }) {
  if (!documents || !Array.isArray(documents)) {
    throw new Error('Invalid documents input');
  }
  
  const allChunks = [];
  
  for (const document of documents) {
    try {
      const documentChunks = await chunkDocument(document, options);
      allChunks.push(...documentChunks);
    } catch (error) {
      console.error(`Error chunking document: ${error.message}`);
    }
  }
  
  return allChunks;
}
```

### 4. Create Chunking API Routes

Now, let's create API endpoints for document chunking:

Create a file `routes/chunking.js`:

```javascript
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
```

### 5. Update Main Application

Now, let's update the main application to include our new chunking routes:

Update `app.js`:

```javascript
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import ingestRoutes from './routes/ingest.js';
import chunkingRoutes from './routes/chunking.js';

// Load environment variables
dotenv.config();

// Verify API key is available
if (!process.env.LLAMA_API_KEY) {
  console.warn('LLAMA_API_KEY not found in environment variables');
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the RAG API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Add routes
app.use('/ingest', ingestRoutes);
app.use('/chunking', chunkingRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 6. Create Chunking Test Script

Create a file `test_chunking.js`:

```javascript
/**
 * Test script for document chunking and embedding
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument } from './utils/documentProcessor.js';
import { chunkDocument } from './utils/documentChunker.js';
import { splitByCharacterCount, splitByParagraphs } from './utils/chunking/simpleChunker.js';
import { splitRecursively, splitByHeadings } from './utils/chunking/recursiveChunker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test document path
const MARKDOWN_FILE_PATH = path.join(__dirname, 'data/samples/sample.md');

/**
 * Test different chunking strategies
 */
async function testChunkingStrategies() {
  console.log('🧪 Testing document chunking strategies...');
  
  try {
    // Process the document
    console.log('\n📝 Processing document:');
    const document = await processDocument(MARKDOWN_FILE_PATH);
    console.log(`Document loaded: ${document.metadata.filename}`);
    
    // Test character-based chunking
    console.log('\n🔤 Testing character-based chunking:');
    const characterChunks = splitByCharacterCount(document.text, 200, 50);
    console.log(`Created ${characterChunks.length} character-based chunks`);
    console.log('First chunk:', characterChunks[0]);
    
    // Test paragraph-based chunking
    console.log('\n📋 Testing paragraph-based chunking:');
    const paragraphChunks = splitByParagraphs(document.text, 2, 1);
    console.log(`Created ${paragraphChunks.length} paragraph-based chunks`);
    console.log('First chunk:', paragraphChunks[0]);
    
    // Test recursive chunking
    console.log('\n🔄 Testing recursive chunking:');
    const recursiveChunks = splitRecursively(document.text, ['\n\n', '\n', '. '], 200, 50);
    console.log(`Created ${recursiveChunks.length} recursive chunks`);
    console.log('First chunk:', recursiveChunks[0]);
    
    // Test heading-based chunking
    console.log('\n📑 Testing heading-based chunking:');
    const headingChunks = splitByHeadings(document.text, 1);
    console.log(`Created ${headingChunks.length} heading-based chunks`);
    console.log('First chunk:', headingChunks[0]);
    
    console.log('\n✅ Chunking strategies test completed successfully!');
  } catch (error) {
    console.error('❌ Chunking strategies test failed:', error);
  }
}

/**
 * Test document chunking with embeddings
 */
async function testChunkingWithEmbeddings() {
  console.log('\n🧪 Testing document chunking with embeddings...');
  
  try {
    // Process the document
    const document = await processDocument(MARKDOWN_FILE_PATH);
    
    // Test character-based chunking with embeddings
    console.log('\n🔤 Testing character-based chunking with embeddings:');
    const characterChunksWithEmbeddings = await chunkDocument(document, { 
      strategy: 'character',
      chunkSize: 200,
      chunkOverlap: 50
    });
    
    console.log(`Created ${characterChunksWithEmbeddings.length} chunks with embeddings`);
    console.log('First chunk text:', characterChunksWithEmbeddings[0].text);
    console.log('First chunk embedding (first 5 dimensions):', 
      characterChunksWithEmbeddings[0].embedding.slice(0, 5));
    
    console.log('\n✅ Chunking with embeddings test completed successfully!');
  } catch (error) {
    console.error('❌ Chunking with embeddings test failed:', error);
  }
}

// Run the tests
async function runTests() {
  await testChunkingStrategies();
  await testChunkingWithEmbeddings();
}

runTests().catch(error => {
  console.error('Error during chunking tests:', error);
});
```

## 🧪 Exercises

1. **Basic Chunking**: Implement the simple chunker with character-based and paragraph-based strategies.

2. **Advanced Chunking**: Implement the recursive chunker with support for different separators and heading-based chunking.

3. **Embedding Generation**: Create the utilities for generating embeddings for text chunks.

4. **Document Chunking Module**: Implement the document chunker that combines processing, chunking, and embedding.

5. **API Integration**: Create the API endpoints for document chunking and update the main application.

6. **Testing**: Run the chunking test script to verify your implementation.

7. **Extension**: Experiment with different chunking strategies and parameters to see how they affect the quality of embeddings and retrieval.

## 📚 Key Concepts

- **Chunking Strategies**: Different approaches to splitting documents (character-based, paragraph-based, recursive, heading-based).
- **Chunk Size and Overlap**: How to balance chunk size for context preservation with overlap for continuity.
- **Embedding Generation**: Converting text chunks into vector representations for semantic search.
- **Metadata Preservation**: Maintaining document metadata throughout the chunking process.

## 📖 Further Reading

- [Chunking Strategies for RAG](https://www.pinecone.io/learn/chunking-strategies/)
- [Text Embeddings Explained](https://huggingface.co/blog/embeddings)
- [Vector Representations of Text](https://www.tensorflow.org/text/guide/word_embeddings)

## 🚀 Next Steps

In [Step 4](../step-04/README.md), we'll learn how to store our chunks and embeddings in a vector database for efficient retrieval.
