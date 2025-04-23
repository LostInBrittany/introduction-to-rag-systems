/**
 * Test script for document ingestion
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument, cleanDocument } from '../utils/documentProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test document paths
const TEXT_FILE_PATH = path.join(__dirname, '../data/samples/sample.txt');
const MARKDOWN_FILE_PATH = path.join(__dirname, '../data/samples/sample.md');
const PDF_FILE_PATH = path.join(__dirname, '../data/samples/sample.pdf');

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
    
    // Test PDF file processing
    console.log('\n📄 Processing PDF file:');
    try {
      const pdfDocument = await processDocument(PDF_FILE_PATH);
      const cleanedPdfDocument = cleanDocument(pdfDocument);
      console.log('PDF document metadata:', cleanedPdfDocument.metadata);
      console.log('PDF document content (excerpt):', cleanedPdfDocument.text.substring(0, 100) + '...');
    } catch (error) {
      console.error('Error processing PDF:', error.message);
      process.exit(1);
    }
    
    console.log('\n✅ Document ingestion test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Document ingestion test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDocumentIngestion().catch(error => {
  console.error('Error during document ingestion test:', error);
  process.exit(1);
});
