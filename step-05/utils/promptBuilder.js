/**
 * Prompt builder for the RAG pipeline
 * Creates prompts for the LLM by combining retrieved chunks with user queries
 */

/**
 * Create a RAG prompt by combining retrieved chunks with the user's question
 * @param {Array<Object>} chunks - Retrieved chunks with their text and metadata
 * @param {string} question - The user's question
 * @returns {string} The formatted prompt for the LLM
 */
export function createRagPrompt(chunks, question) {
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return `I don't have enough information to answer the question: ${question}`;
  }

  // Format the chunks into a context string
  const context = chunks
    .map(chunk => {
      // Include source information if available
      const sourceInfo = chunk.title ? 
        `[Source: ${chunk.title}${chunk.source ? ` (${chunk.source})` : ''}]` : '';
      
      return `${chunk.text}\n${sourceInfo}`;
    })
    .join('\n\n');
  
  // Create the prompt with context and question
  return `Answer the question based on the following context:\n\n` +
         `Context:\n${context}\n\n` +
         `Question: ${question}\n\n` +
         `Answer:`;
}

/**
 * Create a prompt for when no relevant chunks are found
 * @param {string} question - The user's question
 * @returns {string} The formatted prompt for the LLM
 */
export function createNoContextPrompt(question) {
  return `I was asked the following question but couldn't find relevant information in my knowledge base:\n\n` +
         `Question: ${question}\n\n` +
         `Please respond by stating that you don't have enough information to provide a specific answer to this question.`;
}

/**
 * Format retrieved chunks for better readability in the prompt
 * @param {Array<Object>} chunks - Retrieved chunks
 * @returns {string} Formatted context string
 */
export function formatChunks(chunks) {
  if (!chunks || chunks.length === 0) {
    return '';
  }
  
  return chunks
    .map((chunk, index) => {
      const sourceInfo = chunk.title ? 
        `[Source: ${chunk.title}${chunk.source ? ` (${chunk.source})` : ''}]` : '';
      
      return `[${index + 1}] ${chunk.text}\n${sourceInfo}`;
    })
    .join('\n\n');
}
