# 📌 Step 1: Project Setup

In this first step, we'll set up our development environment and create the basic structure for our RAG application.

## 🎯 Learning Objectives
- Configure a Node.js environment for RAG development
- Set up access to LLaMA 3 API
- Create a basic Express.js project structure
- Understand the components of a RAG system

## 🛠️ Setup Instructions

### 1. Initialize a Node.js Project

```bash
# Create a new directory for your project (if not already created)
mkdir rag-app
cd rag-app

# Initialize a new Node.js project
npm init -y
```

### 2. Install Required Dependencies

We'll install the necessary npm packages for our RAG application:

```bash
npm install express dotenv cors
npm install @xenova/transformers
npm install better-sqlite3 sqlite-vec
npm install --save-dev nodemon
```

### 3. Configure API Access

Create a `.env` file to store your API keys:

```
LLM_API_KEY=your_api_key_here
```

⚠️ **Important**: Never commit your `.env` file to version control. Make sure it's included in your `.gitignore`.

### 4. Test Your Setup

Run the provided test script to verify your environment is correctly set up:

```bash
node test/test_setup.js
```

## 📁 Project Structure

```
rag-app/
├── .env                  # Environment variables (API keys)
├── package.json          # Node.js dependencies
├── app.js               # Main Express.js application
├── utils/
│   ├── llm.js           # LLM API utilities
│   └── embeddings.js    # Embedding utilities
└── test/
    └── test_setup.js    # Setup verification script
```

## 🧩 Core Components Explained

### utils/embeddings.js

This module handles the generation of text embeddings using the transformers.js library. Embeddings are vector representations of text that capture semantic meaning, which is essential for the retrieval component of RAG.

**Key Features:**

- **Singleton Pattern**: Uses a singleton class to load the embedding model only once, improving performance.
- **Model Selection**: Uses the `all-MiniLM-L6-v2` model, which generates 384-dimensional embeddings.
- **Asynchronous Processing**: Handles embedding generation asynchronously for better performance.
- **Error Handling**: Includes robust error handling for model loading and embedding generation.

**Main Functions:**

- `getEmbedding(text)`: Converts a text string into a vector embedding.
- `testEmbedding()`: Tests the embedding functionality and returns the embedding dimension.

### utils/llm.js

This module manages interactions with the LLaMA 3 API, handling both connection testing and response generation.

**Key Features:**

- **Environment Configuration**: Uses environment variables for API key, endpoint, and model name.
- **Flexible Model Selection**: Supports configurable model selection through environment variables.
- **HTTP Request Management**: Handles API requests using the native fetch API.
- **Context Integration**: Supports adding retrieval context to prompts for RAG functionality.

**Main Functions:**

- `testLlmConnection()`: Tests the connection to the LLaMA API.
- `generateResponse(prompt, context, maxTokens)`: Generates a response from the LLM based on a prompt and optional context.

These utility modules form the foundation of our RAG system, providing the essential functionality for both the retrieval (embeddings) and generation (LLM) components.

## 📝 Key Files Overview

The project contains several key files, each with a specific purpose:

### package.json

Defines project dependencies including:
- `express`: Web framework for Node.js
- `dotenv`: For loading environment variables
- `cors`: Middleware for enabling CORS
- `@xenova/transformers`: For handling embedding generation
- `better-sqlite3` and `sqlite-vec`: For SQLite database interaction with vector support

### app.js

The main Express.js application file that:
- Sets up the server and middleware
- Defines basic routes for health checks
- Loads environment variables

### utils/llm.js

Handles interactions with the LLaMA 3 API, including:
- Testing the API connection
- Generating responses from the LLM
- Supporting context integration for RAG

### utils/embeddings.js

Manages text embedding generation using transformers.js:
- Implements a singleton pattern for efficient model loading
- Provides functions to generate and test embeddings
- Handles error cases gracefully

### test/test_setup.js

Verifies that the environment is correctly set up by:
- Checking for required packages
- Verifying API key configuration
- Testing the LLaMA API connection
- Testing the embedding model functionality

## 🧪 Exercises

1. **API Key Setup**: Obtain an API key for LLaMA 3 and configure it in your `.env` file.

2. **Environment Testing**: Run the `test/test_setup.js` script and fix any issues that arise.

3. **Express.js Exploration**: Start the Express.js server and access the `/health` endpoint in your browser or using a tool like curl or Postman.

4. **Embedding Experimentation**: Run the `embedding_test.js` script to understand how embeddings capture semantic meaning.

   This exercise demonstrates how vector embeddings work, which is crucial for the retrieval component of RAG systems. The script:
   - Generates embeddings for pairs of text using the same model that will power our retrieval system
   - Calculates cosine similarity between these embeddings to measure semantic relatedness
   - Shows how embeddings capture meaning rather than just keywords
   - Demonstrates why vector similarity is effective for finding relevant documents
   
   Pay attention to how semantically similar texts have higher similarity scores even when they use different words. This is the foundation of effective retrieval in RAG systems.

## 🔍 Key Concepts

- **RAG Architecture**: Understand the components of a RAG system (Retriever and Generator)
- **API Integration**: How to securely connect to external LLM APIs
- **Embeddings**: What they are and how they represent text semantically
- **Express.js**: Basics of creating a REST API with Express.js

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js/index)
- [sqlite-vec Documentation](https://github.com/asg017/sqlite-vec)
- [LLaMA 3 API Documentation](https://ai.meta.com/llama/) (Replace with actual API documentation)

## 🚀 Next Steps

In [Step 2](../step-02/README.md), we'll learn how to ingest documents from various sources and prepare them for our RAG system.
