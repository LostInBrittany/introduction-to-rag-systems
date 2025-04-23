// Direct test script that doesn't use dotenv
const apiEndpoint = 'https://training.ai.cloud.ovh.net/v1/chat/completions';
// Get API key from command line argument to avoid exposing it in the code
const apiKey = process.argv[2] || 'YOUR_API_KEY_HERE';

console.log(`Testing API endpoint directly: ${apiEndpoint}`);

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
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      const text = await response.text();
      console.error('Response:', text);
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
