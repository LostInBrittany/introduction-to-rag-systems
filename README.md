# 🧠 Practical RAG Course: Building with LLaMA 3 and SQLite

This repository contains all the code and materials for a two-day practical course on Retrieval-Augmented Generation (RAG) systems.

## 📚 Course Overview

This hands-on course guides you through building, deploying, and using a complete RAG system from scratch. By the end of the two days, you'll have created a fully functional RAG application that can answer questions based on your own documents.

## 🔧 Tech Stack

- **LLM**: LLaMA 3 70B (via API)
- **Embeddings**: transformers.js or tensorflow.js
- **Database**: SQLite with sqlite-vec extension for vector operations
- **Backend**: Node.js with Express.js
- **Deployment**: Cloud run (Render/Railway/Clever Cloud) or Docker Compose

## 📅 Course Schedule

### Day 1 – From Docs to Answers

**Morning**
- 🔍 Introduction to RAG concepts
- ⚙️ Project setup and environment configuration
- 📄 Document ingestion from various sources
- 🔢 Chunking strategies and embedding generation

**Afternoon**
- 🔎 Vector search implementation
- 🤖 LLM integration with LLaMA 3
- 🧪 Testing the basic RAG pipeline

### Day 2 – Polishing and Deployment

**Morning**
- 🔧 RAG pipeline optimization
- 📝 Prompt engineering techniques
- 🔄 Advanced retrieval methods

**Afternoon**
- 🚀 Deployment to cloud or local environment
- 🖥️ Building a simple frontend
- 🗣️ Final project demonstrations

## 📁 Repository Structure

- **`/rag-examples`**: Simple examples demonstrating core RAG concepts
- **`/step-00`** to **`/step-08`**: Step-by-step implementation of the complete RAG system
- **`/server`**: Backend FastAPI server code
- **`/database`**: Database setup and configuration
- **`/data`**: Sample datasets for testing
- **`/frontend`**: Simple web interface for the RAG application

## 🚀 Getting Started

To begin the course:

1. Clone this repository
2. Follow the setup instructions in [Step 1](/step-01/README.md)
3. Progress through each step sequentially

## 🗺️ Learning Path

### Day 1 - From Docs to Answers

#### 📌 Step 1: Project Setup
- Setting up the Node.js development environment
- Installing required npm dependencies
- Configuring API access for LLaMA 3
- Basic Express.js project structure

#### 📌 Step 2: Document Ingestion
- Loading documents from various sources (PDF, Markdown, web)
- Text extraction techniques
- Document metadata handling
- Building a document pipeline

#### 📌 Step 3: Chunking and Embedding
- Text chunking strategies
- Understanding token limits
- Generating embeddings with transformers.js
- Optimizing chunk size for retrieval

#### 📌 Step 4: Vector Storage
- Setting up SQLite with vector extensions
- Creating vector database schema
- Storing document chunks and embeddings
- Basic vector operations

#### 📌 Step 5: Retrieval Implementation
- Semantic search with vector similarity
- Top-k retrieval methods
- Filtering and metadata-based search
- Evaluating retrieval quality

#### 📌 Step 6: LLM Integration
- Connecting to LLaMA 3 API with Node.js
- Building effective prompts
- Context window management
- Handling API responses with async/await

### Day 2 - Polishing and Deployment

#### 📌 Step 7: RAG Pipeline Optimization
- Prompt engineering techniques
- Hybrid retrieval (vector + keyword)
- Re-ranking strategies
- Handling edge cases and fallbacks

#### 📌 Step 8: Deployment and Frontend
- Deploying the Express.js backend
- Containerization with Docker
- Building a React or Vue.js frontend
- End-to-end testing

## 📋 Prerequisites

- Basic JavaScript/Node.js knowledge
- Familiarity with REST APIs
- Understanding of basic ML/AI concepts
- Docker installed (for local database)
- Git installed

## 📜 License

This project is licensed under the MIT License.
