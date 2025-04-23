import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import ingestRoutes from './routes/ingest.js';
import chunkingRoutes from './routes/chunking.js';
import vectorstoreRoutes from './routes/vectorstore.js';

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
app.use('/vectorstore', vectorstoreRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
