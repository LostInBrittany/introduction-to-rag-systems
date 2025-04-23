/**
 * Embedding Experimentation Script
 * 
 * This script demonstrates how to generate embeddings for different texts
 * and calculate their similarities using cosine similarity.
 */

// Import the embedding utility
import { getEmbedding } from './utils/embeddings.js';

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} Cosine similarity (between -1 and 1)
 */
function cosineSimilarity(vecA, vecB) {
  // Calculate dot product
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  
  // Calculate magnitudes
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  // Calculate cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Format similarity score as a percentage
 * @param {number} similarity - Similarity score (between -1 and 1)
 * @returns {string} Formatted percentage
 */
function formatSimilarity(similarity) {
  // Convert to percentage (0-100%)
  const percentage = ((similarity + 1) / 2) * 100;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Compare the similarity between two texts
 * @param {string} textA - First text
 * @param {string} textB - Second text
 */
async function compareSimilarity(textA, textB) {
  console.log(`\nComparing similarities:\n1: "${textA}"\n2: "${textB}"`);
  
  try {
    // Generate embeddings
    console.log('Generating embeddings...');
    const embeddingA = await getEmbedding(textA);
    const embeddingB = await getEmbedding(textB);
    
    // Calculate similarity
    const similarity = cosineSimilarity(embeddingA, embeddingB);
    
    // Display results
    console.log(`Similarity score: ${similarity.toFixed(4)}`);
    console.log(`Similarity percentage: ${formatSimilarity(similarity)}`);
    console.log(`Interpretation: ${interpretSimilarity(similarity)}`);
  } catch (error) {
    console.error('Error comparing texts:', error.message);
  }
}

/**
 * Provide a human-readable interpretation of similarity score
 * @param {number} similarity - Similarity score (between -1 and 1)
 * @returns {string} Interpretation
 */
function interpretSimilarity(similarity) {
  if (similarity > 0.9) return 'Very high similarity (nearly identical meaning)';
  if (similarity > 0.8) return 'High similarity (very related concepts)';
  if (similarity > 0.7) return 'Strong similarity (clearly related)';
  if (similarity > 0.5) return 'Moderate similarity (somewhat related)';
  if (similarity > 0.3) return 'Low similarity (slightly related)';
  return 'Very low similarity (likely unrelated)';
}

// Main function to run examples
async function main() {
  console.log('🔢 Embedding Experimentation');
  console.log('============================');
  
  // Example 1: Similar sentences with different wording
  await compareSimilarity(
    'The quick brown fox jumps over the lazy dog',
    'A fast fox leaps above a sleepy canine'
  );
  
  // Example 2: Same topic but different aspects
  await compareSimilarity(
    'Machine learning models require large amounts of training data',
    'Neural networks can be trained to recognize patterns in data'
  );
  
  // Example 3: Completely different topics
  await compareSimilarity(
    'JavaScript is a programming language commonly used for web development',
    'The Eiffel Tower is a wrought-iron lattice tower in Paris, France'
  );
  
  // Example 4: Semantically opposite statements
  await compareSimilarity(
    'The stock market increased significantly today',
    'The stock market decreased significantly today'
  );
  
  // Example 5: RAG-related examples
  await compareSimilarity(
    'How does retrieval-augmented generation work?',
    'Explain the process of retrieving documents for LLM context'
  );
}

// Run the main function
main().catch(error => {
  console.error('Error in embedding experiment:', error);
});
