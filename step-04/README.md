# 📚 Step 4: Vector Database Storage

In this step, we'll implement vector database storage for our RAG system using SQLite with vector search capabilities. This will allow us to efficiently store and retrieve embeddings for our document chunks.

## 🎯 Learning Objectives
- Implement a vector database using SQLite with vector extensions
- Create a database schema for storing document chunks and embeddings
- Build utilities for storing and retrieving vector embeddings
- Implement vector similarity search for retrieval

## 💾 Vector Database Overview

After generating embeddings for our document chunks in Step 3, we need to:

1. **Store these embeddings** in a database that supports vector operations
2. **Create indexes** for efficient similarity search
3. **Implement retrieval methods** to find the most relevant chunks for a query

![Vector DB creation pipeline](https://images.ctfassets.net/xjan103pcp94/3q5HUANQ4kS0V23cgEP0JF/ef3b62c5bc5c5c11b734fd3b73f6ea28/image3.png)

*Figure: Vector DB creation pipeline showing the flow from raw documents to processed text, then chunking and embedding. (Source: [Anyscale – Building RAG-based LLM Applications](https://www.anyscale.com/blog/a-comprehensive-guide-for-building-rag-based-llm-applications-part-1))*


## 💾 Why SQLite for Vector Storage?

For our RAG system, we're using SQLite with vector extensions for several reasons:

1. **Simplicity**: SQLite is a self-contained, serverless database that requires no setup or configuration.

2. **Portability**: The entire database is stored in a single file, making it easy to distribute and move.

3. **Zero Configuration**: No need to install and configure a separate database server.

4. **Vector Support**: With the sqlite-vec extension, we get vector similarity search capabilities without the complexity of a dedicated vector database.

5. **Familiar SQL Interface**: Students can use standard SQL queries with added vector operations.

## 📋 Prerequisites

Before starting this step, make sure you've completed:
- [Step 1: Project Setup](../step-01/README.md)
- [Step 2: Document Ingestion](../step-02/README.md)
- [Step 3: Document Chunking and Embedding](../step-03/README.md)

You should have a working environment with:
- Node.js and npm installed
- Document ingestion pipeline functioning
- Document chunking and embedding generation working

## 🛠️ Implementation Steps

### 1. Set Up SQLite with Vector Extensions

First, we need to install the necessary packages:

```bash
npm install better-sqlite3 sqlite-vec
```

### 2. Create Database Connection Utility

Create a file `utils/database.js`:

```javascript
/**
 * Database utility
 * Manages SQLite database with vector extension
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const DB_PATH = join(__dirname, '../data/vectordb.sqlite');

// Ensure data directory exists
const dataDir = join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Initialize the database connection and schema
 * @returns {Object} Database connection
 */
export function initDatabase() {
  // Create database connection
  const db = new Database(DB_PATH);
  
  // Enable vector extension
  db.pragma('journal_mode = WAL');
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT,
      title TEXT,
      filetype TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER,
      text TEXT NOT NULL,
      chunk_index INTEGER,
      chunk_strategy TEXT,
      embedding BLOB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
  `);
  
  return db;
}

// Singleton database connection
let dbInstance = null;

/**
 * Get database connection (singleton pattern)
 * @returns {Object} Database connection
 */
export function getDatabase() {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
```

### 3. Create Vector Storage Utility

Create a file `utils/vectorStorage.js`:

```javascript
/**
 * Vector storage utility
 * Stores and retrieves document chunks with embeddings
 */

import { getDatabase } from './database.js';

/**
 * Store a document in the database
 * @param {Object} document - Document object with metadata
 * @returns {number} Document ID
 */
export function storeDocument(document) {
  const db = getDatabase();
  
  const { source, metadata } = document;
  
  const stmt = db.prepare(`
    INSERT INTO documents (source, title, filetype)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(
    source || metadata.source || '',
    metadata.title || metadata.filename || '',
    metadata.filetype || ''
  );
  
  return result.lastInsertRowid;
}

/**
 * Store a chunk with its embedding in the database
 * @param {Object} chunk - Chunk object with text, metadata, and embedding
 * @param {number} documentId - ID of the parent document
 * @param {number} chunkIndex - Index of the chunk in the document
 * @returns {number} Chunk ID
 */
export function storeChunk(chunk, documentId, chunkIndex) {
  const db = getDatabase();
  
  const { text, metadata, embedding } = chunk;
  
  // Convert embedding array to Buffer
  const embeddingBuffer = embedding ? Buffer.from(new Float32Array(embedding).buffer) : null;
  
  const stmt = db.prepare(`
    INSERT INTO chunks (document_id, text, chunk_index, chunk_strategy, embedding)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    documentId,
    text,
    chunkIndex,
    metadata.chunkStrategy || 'unknown',
    embeddingBuffer
  );
  
  return result.lastInsertRowid;
}

/**
 * Store a document with all its chunks
 * @param {Object} document - Document object with text and metadata
 * @param {Array<Object>} chunks - Array of chunks with text, metadata, and embeddings
 * @returns {Object} Result with document ID and chunk IDs
 */
export function storeDocumentWithChunks(document, chunks) {
  const db = getDatabase();
  
  // Start transaction
  const transaction = db.transaction((document, chunks) => {
    // Store document
    const documentId = storeDocument(document);
    
    // Store chunks
    const chunkIds = [];
    chunks.forEach((chunk, index) => {
      const chunkId = storeChunk(chunk, documentId, index);
      chunkIds.push(chunkId);
    });
    
    return {
      documentId,
      chunkIds
    };
  });
  
  // Execute transaction
  return transaction(document, chunks);
}

/**
 * Find similar chunks for a query embedding
 * @param {Array<number>} queryEmbedding - Query embedding vector
 * @param {number} limit - Maximum number of results to return
 * @param {number} similarityThreshold - Minimum similarity score (0-1)
 * @returns {Array<Object>} Array of chunks with similarity scores
 */
export function findSimilarChunks(queryEmbedding, limit = 5, similarityThreshold = 0.7) {
  const db = getDatabase();
  
  // Convert query embedding to Buffer
  const queryEmbeddingBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);
  
  // Get chunks with similarity scores
  const stmt = db.prepare(`
    SELECT 
      c.id,
      c.text,
      c.chunk_strategy,
      d.source,
      d.title,
      d.filetype,
      vec_cosine_similarity(c.embedding, ?) AS similarity
    FROM 
      chunks c
    JOIN 
      documents d ON c.document_id = d.id
    WHERE 
      c.embedding IS NOT NULL
    ORDER BY 
      similarity DESC
    LIMIT ?
  `);
  
  const results = stmt.all(queryEmbeddingBuffer, limit);
  
  // Filter by similarity threshold
  return results
    .filter(result => result.similarity >= similarityThreshold)
    .map(result => ({
      id: result.id,
      text: result.text,
      source: result.source,
      title: result.title,
      filetype: result.filetype,
      chunkStrategy: result.chunk_strategy,
      similarity: result.similarity
    }));
}

/**
 * Get all documents in the database
 * @returns {Array<Object>} Array of documents
 */
export function getAllDocuments() {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT 
      id,
      source,
      title,
      filetype,
      created_at,
      (SELECT COUNT(*) FROM chunks WHERE document_id = documents.id) AS chunk_count
    FROM 
      documents
    ORDER BY 
      created_at DESC
  `);
  
  return stmt.all();
}

/**
 * Get all chunks for a document
 * @param {number} documentId - Document ID
 * @returns {Array<Object>} Array of chunks
 */
export function getDocumentChunks(documentId) {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT 
      id,
      text,
      chunk_index,
      chunk_strategy,
      created_at
    FROM 
      chunks
    WHERE 
      document_id = ?
    ORDER BY 
      chunk_index
  `);
  
  return stmt.all(documentId);
}
```

### 4. Create Vector Search API Routes

Create a file `routes/vectorstore.js`:

```javascript
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
```

### 5. Update Main Application

Update `app.js` to include the vector storage routes:

```javascript
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import ingestRoutes from './routes/ingest.js';
import chunkingRoutes from './routes/chunking.js';
import vectorstoreRoutes from './routes/vectorstore.js';

// Load environment variables
dotenv.config();

// Verify API key is available
if (!process.env.LLM_API_KEY) {
  console.warn('LLM_API_KEY not found in environment variables');
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
app.use('/vectorstore', vectorstoreRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 6. Create Vector Database Test Script

Create a file `test_vectordb.js`:

```javascript
/**
 * Test script for vector database storage and retrieval
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument } from './utils/documentProcessor.js';
import { chunkDocument } from './utils/documentChunker.js';
import { getEmbedding } from './utils/embeddings.js';
import { 
  storeDocumentWithChunks, 
  findSimilarChunks,
  getAllDocuments,
  closeDatabase
} from './utils/vectorStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test document path
const MARKDOWN_FILE_PATH = path.join(__dirname, 'data/samples/sample.md');

/**
 * Test storing a document in the vector database
 */
async function testStoreDocument() {
  console.log('🧪 Testing document storage in vector database...');
  
  try {
    // Process the document
    console.log('\n📝 Processing document:');
    const document = await processDocument(MARKDOWN_FILE_PATH);
    console.log(`Document loaded: ${document.metadata.filename}`);
    
    // Chunk the document and generate embeddings
    console.log('\n🔪 Chunking document and generating embeddings:');
    const chunks = await chunkDocument(document, { 
      strategy: 'character',
      chunkSize: 200,
      chunkOverlap: 50
    });
    console.log(`Created ${chunks.length} chunks with embeddings`);
    
    // Store document and chunks in the vector database
    console.log('\n💾 Storing document and chunks in vector database:');
    const result = storeDocumentWithChunks(document, chunks);
    console.log(`Document stored with ID: ${result.documentId}`);
    console.log(`Stored ${result.chunkIds.length} chunks`);
    
    console.log('\n✅ Document storage test completed successfully!');
    return result.documentId;
  } catch (error) {
    console.error('❌ Document storage test failed:', error);
    throw error;
  }
}

/**
 * Test searching for similar chunks
 * @param {string} query - Query text
 */
async function testSearchSimilarChunks(query) {
  console.log(`\n🧪 Testing vector search for query: "${query}"`);
  
  try {
    // Generate embedding for the query
    console.log('\n🔢 Generating query embedding:');
    const queryEmbedding = await getEmbedding(query);
    console.log('Query embedding generated');
    
    // Find similar chunks
    console.log('\n🔍 Searching for similar chunks:');
    const similarChunks = findSimilarChunks(queryEmbedding, 3, 0.5);
    console.log(`Found ${similarChunks.length} similar chunks`);
    
    // Display results
    if (similarChunks.length > 0) {
      console.log('\nSearch results:');
      similarChunks.forEach((chunk, index) => {
        console.log(`\nResult ${index + 1} (similarity: ${chunk.similarity.toFixed(4)}):`);
        console.log(`Source: ${chunk.title} (${chunk.source})`);
        console.log(`Text: ${chunk.text.substring(0, 150)}...`);
      });
    } else {
      console.log('No similar chunks found');
    }
    
    console.log('\n✅ Vector search test completed successfully!');
  } catch (error) {
    console.error('❌ Vector search test failed:', error);
  }
}

/**
 * Test listing all documents
 */
function testListDocuments() {
  console.log('\n🧪 Testing document listing:');
  
  try {
    const documents = getAllDocuments();
    console.log(`Found ${documents.length} documents in the database`);
    
    if (documents.length > 0) {
      console.log('\nDocuments:');
      documents.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.title} (${doc.filetype}) - ${doc.chunk_count} chunks`);
      });
    }
    
    console.log('\n✅ Document listing test completed successfully!');
  } catch (error) {
    console.error('❌ Document listing test failed:', error);
  }
}

// Run the tests
async function runTests() {
  try {
    // Store a document
    await testStoreDocument();
    
    // List all documents
    testListDocuments();
    
    // Search for similar chunks
    await testSearchSimilarChunks('markdown features');
    
    // Close database connection
    closeDatabase();
  } catch (error) {
    console.error('Error during vector database tests:', error);
    closeDatabase();
  }
}

runTests().catch(error => {
  console.error('Error during tests:', error);
  closeDatabase();
});
```

### 7. Update Package.json

Update `package.json` to include the new dependencies:

```json
{
  "name": "rag-step-04",
  "version": "1.0.0",
  "description": "Vector database storage for RAG system",
  "main": "app.js",
  "type": "module",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "node test_vectordb.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "pdf-parse": "^1.1.1",
    "@xenova/transformers": "^2.6.0",
    "better-sqlite3": "^8.5.0",
    "sqlite-vec": "^0.5.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🚀 Running the Server and Testing the API

After implementing the vector database functionality, you can run the server and test the API endpoints using curl commands.

### Starting the Server

Run the following command to start the server:

```bash
node app.js
```

You should see the message: `Server running on http://localhost:3000`

### Testing the API with Curl

1. **Health Check**

   Verify that the server is running properly:

   ```bash
   curl -X GET http://localhost:3000/health
   ```

   Expected response: `{"status":"healthy"}`

2. **Store a Document**

   Store a document with its chunks in the vector database:

   ```bash
   curl -X POST http://localhost:3000/vectorstore/store \
     -H "Content-Type: application/json" \
     -d '{"filePath": "./data/samples/sample.md", "options": {"strategy": "character", "chunkSize": 1000, "chunkOverlap": 200}}'
   ```

   Expected response: `{"success":true,"documentId":1,"chunkCount":1}`

3. **List All Documents**

   Retrieve all documents stored in the database:

   ```bash
   curl -X GET http://localhost:3000/vectorstore/documents
   ```

   Expected response: A JSON object containing all stored documents with their metadata.

4. **Get Document Chunks**

   Retrieve chunks for a specific document (replace `1` with the actual document ID):

   ```bash
   curl -X GET http://localhost:3000/vectorstore/documents/1/chunks
   ```

   Expected response: A JSON object containing all chunks for the specified document.

5. **Search for Similar Chunks**

   Perform a semantic search to find chunks similar to a query:

   ```bash
   curl -X POST http://localhost:3000/vectorstore/search \
     -H "Content-Type: application/json" \
     -d '{"query": "markdown features", "limit": 3, "threshold": 0.5}'
   ```

   Expected response: A JSON object containing chunks ranked by similarity to the query.

## 🧪 Exercises

1. **Database Setup**: Implement the SQLite database with vector extensions.

2. **Vector Storage**: Create the utilities for storing documents and chunks with embeddings.

3. **Vector Search**: Implement similarity search for finding relevant chunks.

4. **API Integration**: Create the API endpoints for vector storage and retrieval.

5. **Testing**: Run the vector database test script to verify your implementation.

6. **Extension**: Experiment with different similarity thresholds and see how they affect retrieval quality.

## 📚 Key Concepts

- **Vector Database**: A database optimized for storing and querying vector embeddings.
- **Similarity Search**: Finding vectors that are similar to a query vector using distance metrics.
- **Cosine Similarity**: A measure of similarity between two vectors that looks at the angle between them.
- **Indexing**: Creating specialized data structures to speed up vector similarity searches.

## 📖 Further Reading

- [Vector Databases Explained](https://www.pinecone.io/learn/vector-database/)
- [Similarity Search Fundamentals](https://www.sbert.net/examples/applications/semantic-search/README.html)
- [SQLite Vector Extensions](https://github.com/asg017/sqlite-vec)

## 🚀 Next Steps

In [Step 5](../step-05/README.md), we'll implement the complete RAG pipeline, combining all the components we've built so far to create a fully functional question-answering system.
