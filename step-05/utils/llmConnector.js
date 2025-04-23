/**
 * LLM connector for the RAG pipeline
 * Handles communication with the LLM API
 */

import dotenv from 'dotenv';
// Using native fetch API (available in Node.js v18+)

// Load environment variables
dotenv.config();

// Get API key and URL from environment variables
const LLAMA_API_KEY = process.env.LLAMA_API_KEY;
const LLAMA_API_ENDPOINT = process.env.LLAMA_API_ENDPOINT;
const LLAMA_MODEL = process.env.LLAMA_MODEL || 'Meta-Llama-3_1-70B-Instruct';

/**
 * Generate a response from the LLM
 * @param {string} prompt - The prompt to send to the LLM
 * @param {Object} options - Additional options for the LLM
 * @returns {Promise<string>} The LLM's response
 */
export async function generateLlmResponse(prompt, options = {}) {
  if (!LLAMA_API_KEY) {
    throw new Error('LLAMA_API_KEY is not set in environment variables');
  }

  try {
    const response = await fetch(LLAMA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || LLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'You are a helpful assistant that answers questions based on the provided context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`LLM API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating LLM response:', error);
    throw new Error(`Failed to generate LLM response: ${error.message}`);
  }
}

/**
 * Test the LLM API connection
 * @returns {Promise<Object>} Result of the test
 */
export async function testLlmConnection() {
  if (!LLAMA_API_KEY) {
    return { 
      success: false, 
      message: 'LLAMA_API_KEY is not set in environment variables' 
    };
  }

  try {
    const response = await fetch(LLAMA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model: LLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Hello, are you working?'
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: `API error: ${response.status} ${response.statusText}`,
        error: errorData
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: 'Successfully connected to LLaMA API',
      response: data.choices[0].message.content
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Connection error: ${error.message}`,
      error: error
    };
  }
}
