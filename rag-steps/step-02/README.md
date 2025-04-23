# 📚 Step 2: Document Ingestion

In this step, we'll build the document ingestion pipeline for our RAG system. This is a crucial component that allows the system to process and store various document types for later retrieval.

## 🎯 Learning Objectives
- Implement document loading from various sources (PDF, Markdown, text)
- Create a document processing pipeline
- Extract and clean text from documents
- Prepare documents for chunking and embedding

## 🔄 Vector DB Creation Pipeline

Before diving into document ingestion, it's important to understand how it fits into the broader Vector DB creation pipeline:

![Vector DB creation pipeline](https://images.ctfassets.net/xjan103pcp94/3q5HUANQ4kS0V23cgEP0JF/ef3b62c5bc5c5c11b734fd3b73f6ea28/image3.png)

*Figure: Vector DB creation pipeline showing the flow from raw documents to processed text, then chunking and embedding. (Source: [Anyscale – Building RAG-based LLM Applications](https://www.anyscale.com/blog/a-comprehensive-guide-for-building-rag-based-llm-applications-part-1))*

The complete Vector DB creation pipeline consists of several stages:

1. **Document Ingestion** (our focus in this step)
   - Loading documents from various sources
   - Extracting text and metadata
   - Cleaning and preprocessing the text

2. **Document Chunking** (coming in Step 3)
   - Splitting documents into smaller, manageable chunks
   - Implementing different chunking strategies (fixed size, semantic, etc.)
   - Preserving context and metadata during chunking

3. **Embedding Generation** (coming in Step 3)
   - Converting text chunks into vector embeddings
   - Using embedding models to capture semantic meaning
   - Optimizing embedding quality and performance

4. **Vector Database Storage** (coming in Step 4)
   - Storing embeddings in a vector database
   - Implementing efficient indexing for similarity search
   - Managing metadata alongside embeddings

## 🔄 Document Ingestion Deep Dive

In this step, we focus specifically on the document ingestion phase, which is the foundation of the entire Vector DB creation pipeline. Document ingestion involves:

1. **Loading documents from various sources**
   - Text files (.txt)
   - Markdown files (.md)
   - PDF documents (.pdf)
   - (Extensible to other formats like HTML, DOCX, etc.)

2. **Extracting text and metadata**
   - Parsing document content
   - Identifying document structure
   - Extracting useful metadata (title, author, creation date, etc.)

3. **Cleaning and preprocessing text**
   - Removing excessive whitespace
   - Handling special characters
   - Normalizing text format
   - Preparing text for further processing

Effective document ingestion ensures that the downstream processes (chunking, embedding, and storage) have high-quality, well-structured data to work with. Poor document ingestion can lead to low-quality embeddings and ultimately affect the performance of the entire RAG system.

## 📋 Prerequisites

Before starting this step, make sure you've completed [Step 1: Project Setup](../step-01/README.md) and have a working environment with:
- Node.js and npm installed
- Express.js server set up
- LLaMA API connection working
- Embedding generation functioning

## 🛠️ Implementation Steps

### 1. Create Document Loader Utilities

First, let's create a directory for our document loaders:

```bash
mkdir -p utils/loaders
```

#### Text Document Loader

Create a file `utils/loaders/textLoader.js`:

```javascript
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
```

#### Markdown Document Loader

Create a file `utils/loaders/markdownLoader.js`:

```javascript
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
```

#### PDF Document Loader

For PDF loading, we'll need to install a PDF parsing library:

```bash
npm install pdf-parse
```

Create a file `utils/loaders/pdfLoader.js`:

```javascript
/**
 * PDF document loader
 * Loads and processes PDF files
 */

import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

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
```

### 2. Create Document Processor

Now, let's create a document processor that can handle different file types:

Create a file `utils/documentProcessor.js`:

```javascript
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
```

### 3. Create Document Ingestion API

Now, let's create an API endpoint to ingest documents:

Create a file `routes/ingest.js`:

```javascript
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
```

### 4. Update Main Application

Now, let's update the main application to include our new ingestion routes:

Update `app.js`:

```javascript
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import ingestRoutes from './routes/ingest.js';

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

// Add ingestion routes
app.use('/ingest', ingestRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 5. Create Test Documents

Create a directory for test documents:

```bash
mkdir -p data/samples
```

Create a sample text file `data/samples/sample.txt`:

```
This is a sample text document for testing the document ingestion pipeline.
It contains plain text that will be processed by our RAG system.
The document ingestion pipeline should extract this text and prepare it for chunking and embedding.
```

Create a sample markdown file `data/samples/sample.md`:

```markdown
# Sample Markdown Document

This is a sample markdown document for testing the document ingestion pipeline.

## Features

- Supports headings
- Handles lists
- Processes formatting

The document ingestion pipeline should extract this text and prepare it for chunking and embedding.
```

### 6. Create Document Ingestion Test Script

Create a file `test_ingest.js`:

```javascript
/**
 * Test script for document ingestion
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument, cleanDocument } from './utils/documentProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test document paths
const TEXT_FILE_PATH = path.join(__dirname, 'data/samples/sample.txt');
const MARKDOWN_FILE_PATH = path.join(__dirname, 'data/samples/sample.md');

/**
 * Test document ingestion
 */
async function testDocumentIngestion() {
  console.log('🧪 Testing document ingestion...');
  
  try {
    // Test text file processing
    console.log('\n📄 Processing text file:');
    const textDocument = await processDocument(TEXT_FILE_PATH);
    const cleanedTextDocument = cleanDocument(textDocument);
    console.log('Text document metadata:', cleanedTextDocument.metadata);
    console.log('Text document content (excerpt):', cleanedTextDocument.text.substring(0, 100) + '...');
    
    // Test markdown file processing
    console.log('\n📝 Processing markdown file:');
    const markdownDocument = await processDocument(MARKDOWN_FILE_PATH);
    const cleanedMarkdownDocument = cleanDocument(markdownDocument);
    console.log('Markdown document metadata:', cleanedMarkdownDocument.metadata);
    console.log('Markdown document content (excerpt):', cleanedMarkdownDocument.text.substring(0, 100) + '...');
    
    console.log('\n✅ Document ingestion test completed successfully!');
  } catch (error) {
    console.error('❌ Document ingestion test failed:', error);
  }
}

// Run the test
testDocumentIngestion().catch(error => {
  console.error('Error during document ingestion test:', error);
});
```

## 🧪 Exercises

1. **Basic Document Loading**: Implement the document loaders for text, markdown, and PDF files.

2. **Document Processing**: Create the document processor that can handle different file types and clean the text.

3. **API Integration**: Implement the API endpoint for document ingestion and update the main application.

4. **Testing**: Create test documents and run the document ingestion test script.

5. **Extension**: Add support for additional document types (HTML, DOCX, etc.) by creating new loaders.

## 📚 Key Concepts

- **Document Loaders**: Components that extract text and metadata from different file formats.
- **Document Processing**: The pipeline for cleaning and preparing documents for further processing.
- **Metadata Extraction**: Capturing important information about documents for better retrieval.
- **API Design**: Creating RESTful endpoints for document ingestion.

## 📖 Further Reading

- [Document Processing Best Practices](https://www.pinecone.io/learn/document-processing/)
- [Text Extraction Techniques](https://towardsdatascience.com/text-extraction-and-parsing-for-nlp-a-practical-approach-c57f1b6c0554)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

## 🚀 Next Steps

In [Step 3](../step-03/README.md), we'll learn how to chunk documents and generate embeddings for efficient retrieval.
