# 🧠 Practical RAG Course: Building with LLaMA 3 and SQLite

This repository contains all the code and materials for a two-day practical course on Retrieval-Augmented Generation (RAG) systems.

## For CESI DIA2 students

You will find in your Discord the parameters to connect to a LLM, a LLaMA 3 70B hosted on OVHcloud AI Endpoints. Use these parameters to configure your environment for this course.

## 📚 Course Overview

This hands-on course guides you through building, deploying, and using a complete RAG system from scratch. By the end of the two days, you'll have created a fully functional RAG application that can answer questions based on your own documents.

## 🔧 Tech Stack

- **LLM**: Any LLM (local or cloud-based) offering OpenAI API compatibility
- **Embeddings**: transformers.js or tensorflow.js
- **Database**: SQLite with sqlite-vec extension for vector operations
- **Backend**: Node.js with Express.js
- **Deployment**: Any cloud provider (e.g., Clever Cloud) or Docker Compose

## 📚 Course Content

### Foundation (Steps 1-2)
- 🔍 Introduction to RAG concepts
- ⚙️ Project setup and environment configuration (Step 1)
- 📄 Document ingestion from various sources (Step 2)

### Core RAG Pipeline (Steps 3-5)
- 🔢 Chunking strategies and embedding generation (Step 3)
- 💾 Vector database implementation (Step 4)
- 🔎 Retrieval system development (Step 5)
- 🤖 LLM integration (Step 5)
- 🧪 Testing the basic RAG pipeline (Step 5)

### Advanced Features & Deployment (Steps 6-8)
- 🔧 RAG pipeline optimization (Step 6)
- 📝 Prompt engineering techniques (Step 7)
- 🔄 Advanced retrieval methods (Step 7)
- 🚀 Deployment to cloud or local environment (Step 8)
- 🖥️ Building a simple frontend (Step 8)
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

### Foundation

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

### Core RAG Pipeline

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

#### 📌 Step 5: Complete RAG Pipeline
- Basic vector similarity search (cosine)
- Simple top-K retrieval
- Integrating retrieval with LLM
- Building a functional RAG system

### Advanced Features & Deployment

#### 📌 Step 6: RAG Pipeline Optimization
- Prompt engineering techniques
- Improving retrieval accuracy
- Handling edge cases
- Performance optimization

#### 📌 Step 7: Advanced Retrieval Methods
- Hybrid retrieval (vector + keyword)
- Re-ranking strategies
- Handling edge cases and fallbacks
- Advanced prompt engineering

#### 📌 Step 8: Deployment and Frontend
- Deploying the Express.js backend
- Containerization with Docker
- Building a simple web frontend
- End-to-end testing

## 📋 Prerequisites

- Basic JavaScript/Node.js knowledge
- Familiarity with REST APIs
- Understanding of basic ML/AI concepts
- Docker installed (for local database)
- Git installed

## 📜 License

This course is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC-BY-SA-NC 4.0).

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

For more details: [CC-BY-SA-NC 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0/)
