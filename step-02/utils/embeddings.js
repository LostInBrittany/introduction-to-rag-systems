// We'll use a singleton pattern to avoid loading the model multiple times
class EmbeddingModel {
  static model = null;
  
  static async getInstance() {
    if (this.model === null) {
      // Initialize the model on first use
      console.log('Loading embedding model...');
      // Import pipeline from transformers
      const { pipeline } = await import('@xenova/transformers');
      this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Embedding model loaded successfully');
    }
    return this.model;
  }
}

/**
 * Generate embedding for a text string
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} The embedding vector
 */
async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  
  // Get the model
  const model = await EmbeddingModel.getInstance();
  
  // Generate embedding
  const result = await model(text, { pooling: 'mean', normalize: true });
  
  // Return the embedding as a regular array
  return Array.from(result.data);
}

/**
 * Test the embedding functionality
 * @returns {Promise<Object>} Result of the test
 */
async function testEmbedding() {
  const testText = 'This is a test sentence for embedding generation.';
  try {
    const embedding = await getEmbedding(testText);
    // Check if embedding is the right shape (all-MiniLM-L6-v2 produces 384-dimensional embeddings)
    if (embedding.length === 384) {
      return { success: true, message: `Successfully generated embedding with dimension ${embedding.length}` };
    } else {
      return { success: false, message: `Embedding has incorrect dimension: ${embedding.length}` };
    }
  } catch (error) {
    return { success: false, message: `Error generating embedding: ${error.message}` };
  }
}

export { getEmbedding, testEmbedding };
