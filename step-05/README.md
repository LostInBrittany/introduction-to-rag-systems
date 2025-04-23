# 📚 Step 5: Complete RAG Pipeline

In this step, we'll build a complete Retrieval-Augmented Generation (RAG) pipeline by connecting our vector database from Step 4 with a Large Language Model. This will create a functional question-answering system that can respond to queries based on our document collection.

## 🎯 Learning Objectives
- Understand the core components of a RAG pipeline
- Implement simple vector similarity search with cosine similarity
- Create a basic top-K retrieval function
- Connect the retrieval system with the LLM
- Build a complete end-to-end RAG application

## 🔄 Understanding the RAG Pipeline

A complete RAG pipeline consists of three main components:

1. **Retrieval**: Finding the most relevant document chunks from our vector database
2. **Augmentation**: Adding the retrieved context to the user's query
3. **Generation**: Using an LLM to generate a response based on the augmented query

![RAG Pipeline](https://miro.medium.com/v2/resize:fit:1400/1*g3J-A7W3RBFcw8K_UJ-Ucw.png)

*Figure: The basic RAG pipeline showing retrieval, augmentation, and generation steps*

### Vector Similarity Search

For the retrieval component, we'll use cosine similarity to find the most relevant chunks. Cosine similarity measures the angle between two vectors, focusing on their direction rather than magnitude:

```javascript
function cosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

## 🔝 Simple Top-K Retrieval

For our RAG pipeline, we'll implement a straightforward top-K retrieval function that:

1. Takes a query embedding as input
2. Compares it to all chunk embeddings in our database using cosine similarity
3. Returns the K most similar chunks

```javascript
/**
 * Retrieve the top K most similar chunks to a query embedding
 * @param {Array<number>} queryEmbedding - The embedding of the query
 * @param {number} k - The number of chunks to retrieve (default: 3)
 * @returns {Array<Object>} The most similar chunks with their similarity scores
 */
export function retrieveTopK(queryEmbedding, k = 3) {
  const stmt = db.prepare(`
    SELECT 
      c.id, 
      c.document_id, 
      c.text, 
      c.embedding, 
      d.title, 
      d.source
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
  `);
  
  const chunks = stmt.all();
  
  // Calculate similarity for each chunk
  const chunksWithSimilarity = chunks.map(chunk => {
    // Handle binary embeddings stored in the database
    let embedding;
    
    if (chunk.embedding) {
      if (typeof chunk.embedding === 'string') {
        // Try to parse as JSON string
        try {
          embedding = JSON.parse(chunk.embedding);
        } catch (error) {
          console.error('Unable to parse embedding as JSON:', error);
          return null; // Skip this chunk
        }
      } else {
        // Handle binary data (BLOB)
        try {
          // Convert BLOB to Float32Array
          const embeddingBuffer = Buffer.from(chunk.embedding);
          embedding = new Float32Array(embeddingBuffer.buffer, embeddingBuffer.byteOffset, embeddingBuffer.byteLength / 4);
          
          // Convert to regular array for consistent handling
          embedding = Array.from(embedding);
        } catch (error) {
          console.error('Unable to parse binary embedding:', error);
          return null; // Skip this chunk
        }
      }
    } else {
      console.error('Embedding is missing');
      return null; // Skip this chunk
    }
    
    // Calculate similarity between query and chunk
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    
    return {
      id: chunk.id,
      document_id: chunk.document_id,
      text: chunk.text,
      title: chunk.title,
      source: chunk.source,
      similarity
    };
  })
  .filter(chunk => chunk !== null) // Remove null entries
  .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (descending)
  .slice(0, k); // Get top K
  
  return chunksWithSimilarity;
}
```

For our initial implementation, we'll use a fixed K value of 3, which provides a good balance between context relevance and LLM input constraints.

## 🔗 Connecting Retrieval to the LLM

Once we've retrieved the most relevant chunks, we need to:

1. Format them into a context string
2. Create a prompt that includes both the context and the user's question
3. Send this prompt to the LLM for generation

```javascript
/**
 * Create a RAG prompt by combining retrieved chunks with the user's question
 * @param {Array<Object>} chunks - Retrieved chunks with their text and metadata
 * @param {string} question - The user's question
 * @returns {string} The formatted prompt for the LLM
 */
export function createRagPrompt(chunks, question) {
  // Format the chunks into a context string with source information
  const context = chunks
    .map((chunk, index) => {
      return `Document ${index + 1} (${chunk.title || 'Untitled'}):\n${chunk.text}`;
    })
    .join('\n\n');
  
  // Create the prompt with context and question
  return `Answer the question based only on the following context. If the context doesn't contain the answer, say "I don't have enough information to answer this question."\n\n` +
         `Context:\n${context}\n\n` +
         `Question: ${question}\n\n` +
         `Answer:`;
}
```

This simple prompt template instructs the LLM to answer the question based only on the provided context.

## 🔧 Building the Complete RAG Pipeline

Now we'll combine all components into a complete RAG pipeline:

```javascript
/**
 * Process a user query through the RAG pipeline
 * @param {string} query - The user's question
 * @param {Object} options - Additional options for the pipeline
 * @returns {Promise<Object>} Object containing the response and metadata
 */
export async function processQuery(query, options = {}) {
  try {
    console.log(`Processing query: "${query}"`);
    
    // 1. Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);
    console.log(`Generated query embedding with dimension ${queryEmbedding.length}`);
    
    // 2. Retrieve relevant chunks
    const k = options.k || 3;
    const relevantChunks = retrieveTopK(queryEmbedding, k);
    console.log(`Retrieved ${relevantChunks.length} relevant chunks`);
    
    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information to answer your question.",
        chunks: [],
        error: null
      };
    }
    
    // 3. Create the RAG prompt
    const prompt = createRagPrompt(relevantChunks, query);
    
    // 4. Generate response from LLM
    const systemPrompt = options.systemPrompt || 
      'You are a helpful AI assistant that answers questions based on the provided context.';
    
    const answer = await generateLlmResponse(prompt, {
      systemPrompt,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 500
    });
    
    return {
      answer,
      chunks: relevantChunks,
      error: null
    };
  } catch (error) {
    console.error('Error in RAG pipeline:', error);
    return {
      answer: 'Sorry, I encountered an error while processing your question.',
      chunks: [],
      error: error.message
    };
  }
}
```

This function represents the entire RAG pipeline, from query embedding to LLM response generation.

## 📋 Getting Started

### Prerequisites

Make sure you have completed Step 4 and have a working vector database system.

### Setup

1. Install the required packages:
```bash
npm install
```

2. Create a `.env` file with your API keys (if you haven't already):
```
# LLaMA API Endpoint
LLAMA_API_ENDPOINT=https://llama-3-1-70b-instruct.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1/chat/completions

# LLaMA Model Name
LLAMA_MODEL=Meta-Llama-3_1-70B-Instruct

# LLaMA API Key
LLAMA_API_KEY=your_api_key_here
```

3. Start the server:
```bash
npm start
```

You should see the message: `Server running on http://localhost:3000`

### Testing the RAG Pipeline

We've included a test script to evaluate the complete RAG pipeline:

```bash
# Run all tests
npm test

# Test the RAG pipeline
node test/test_rag_pipeline.js
```

### Using the RAG API

Once the server is running, you can use the RAG API to ask questions:

```bash
curl -X POST http://localhost:3000/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the key features of markdown?"}'
```

## 🔍 Key Files

- `utils/ragPipeline.js`: Implements the complete RAG pipeline
- `utils/retrieval.js`: Contains functions for vector similarity search and top-K retrieval
- `utils/promptBuilder.js`: Creates prompts for the LLM
- `utils/llmConnector.js`: Handles communication with the LLM API
- `routes/rag.js`: API endpoints for the RAG system

## 🚀 Next Steps

After completing this step, you'll have a functional RAG system. In [Step 6](../step-06/README.md), we'll focus on improving the LLM integration with more advanced prompt engineering and context window management techniques.
