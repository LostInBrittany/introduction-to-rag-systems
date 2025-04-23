import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_ENDPOINT = process.env.LLM_API_ENDPOINT;
const LLM_MODEL = process.env.LLM_MODEL || 'Meta-Llama-3_1-70B-Instruct';

/**
 * Test the LLM API connection
 * @returns {Promise<Object>} Result of the test
 */
async function testLlmConnection() {
  if (!LLM_API_KEY) {
    return { 
      success: false, 
      message: 'LLM_API_KEY is not set in environment variables' 
    };
  }

  try {
    const response = await fetch(LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
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
        details: errorData
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: 'LLM API connection successful',
      data: data
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Connection error: ${error.message}`,
      error: error,
      endpoint: LLM_API_ENDPOINT
    };
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
    'Authorization': `Bearer ${LLM_API_KEY}`,
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
    const response = await fetch(LLM_API_URL, {
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

/**
 * Generate a response from the LLM
 * @param {string} prompt - The prompt to send to the LLM
 * @param {Object} options - Additional options for the LLM
 * @returns {Promise<string>} The LLM's response
 */
async function generateLlmResponse(prompt, options = {}) {
  if (!LLM_API_KEY) {
    throw new Error('LLM_API_KEY is not set in environment variables');
  }

  try {
    const response = await fetch(LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || LLM_MODEL,
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

export { testLlmConnection, generateResponse, generateLlmResponse };
