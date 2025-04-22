# 🧠 Practical RAG Course: Building with LLaMA 3 and PostgreSQL

This repository contains all the code and materials for a two-day practical course on Retrieval-Augmented Generation (RAG) systems.

## 📚 Course Overview

This hands-on course guides you through building, deploying, and using a complete RAG system from scratch. By the end of the two days, you'll have created a fully functional RAG application that can answer questions based on your own documents.

## 🔧 Tech Stack

- **LLM**: LLaMA 3 70B (via API)
- **Embeddings**: transformers.js or tensorflow.js
- **Database**: PostgreSQL with pgvector or MongoDB with vector search
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
- **`/rag-steps`**: Step-by-step implementation of the complete RAG system
- **`/server`**: Backend FastAPI server code
- **`/database`**: Database setup and configuration
- **`/data`**: Sample datasets for testing
- **`/frontend`**: Simple web interface for the RAG application

## 🚀 Getting Started

To begin the course:

1. Clone this repository
2. Follow the setup instructions in [Step 1](/rag-steps/step-01/README.md)
3. Progress through each step in the `/rag-steps` directory

## 📋 Prerequisites

- Basic JavaScript/Node.js knowledge
- Familiarity with REST APIs
- Understanding of basic ML/AI concepts
- Docker installed (for local database)
- Git installed

## 📜 License

This project is licensed under the MIT License.
