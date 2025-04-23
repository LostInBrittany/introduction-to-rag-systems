require('dotenv').config();

const apiEndpoint = process.env.LLAMA_API_ENDPOINT;
const apiKey = process.env.LLAMA_API_KEY;

console.log(`Testing API endpoint: ${apiEndpoint}`);

async function testApiConnection() {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3-70b-chat',
        messages: [{ role: 'user', content: 'Hello, are you working?' }],
        max_tokens: 50
      })
    });
    
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      console.error('Response:', await response.text());
      return;
    }
    
    const data = await response.json();
    console.log('API connection successful!');
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error connecting to API:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testApiConnection();
