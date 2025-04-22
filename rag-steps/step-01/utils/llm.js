import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const LLAMA_API_KEY = process.env.LLAMA_API_KEY;
const LLAMA_API_URL = process.env.LLAMA_API_ENDPOINT;
const LLAMA_MODEL = process.env.LLAMA_MODEL;

/**
 * Test connection to LLaMA API
 * @returns {Promise<Object>} Result of the test
 */
async function testLlmConnection() {
  const headers = {
    'Authorization': `Bearer ${LLAMA_API_KEY}`,
    'Content-Type': 'application/json'
  };
  
  // Create the request data
  const data = {
    messages: [{ role: 'user', content: 'Hello, are you working?' }],
    max_tokens: 50,
    temperature: 0.7
  };
  
  // Add model if specified in environment variables
  if (LLAMA_MODEL) {
    data.model = LLAMA_MODEL;
  }
  
  // Make the API request
  
  try {
    const response = await fetch(LLAMA_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    return { success: false, error: error.message, url: LLAMA_API_URL };
  }
}

/**
 * Generate a response from LLaMA based on prompt and optional context
 * @param {string} prompt - The user's prompt
 * @param {string} context - Optional context for RAG
 * @param {number} maxTokens - Maximum tokens to generate
 * @returns {Promise<string>} The generated response
 */
async function generateResponse(prompt, context = null, maxTokens = 1024) {
  const headers = {
    'Authorization': `Bearer ${LLAMA_API_KEY}`,
    'Content-Type': 'application/json'
  };
  
  const messages = [];
  
  // Add system message with context if provided
  if (context) {
    messages.push({
      role: 'system',
      content: `You are a helpful assistant who answers questions based only on the following context: ${context}`
    });
  } else {
    messages.push({
      role: 'system',
      content: 'You are a helpful assistant.'
    });
  }
  
  // Add user prompt
  messages.push({ role: 'user', content: prompt });
  
  const data = {
    model: 'llama-3-70b-chat',
    messages: messages,
    max_tokens: maxTokens
  };
  
  try {
    const response = await fetch(LLAMA_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const responseData = await response.json();
    return responseData.choices[0].message.content;
  } catch (error) {
    throw new Error(`Error generating response: ${error.message}`);
  }
}

export { testLlmConnection, generateResponse };
