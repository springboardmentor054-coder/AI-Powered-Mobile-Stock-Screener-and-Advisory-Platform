const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing screener API endpoint...\n');
    
    // First, let's test with "show all stocks" to verify API works
    console.log('1. Testing: "show all stocks"');
    const response1 = await fetch('http://localhost:5000/api/screener/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTY0MjQ2NDAwMH0.test'
      },
      body: JSON.stringify({
        query: 'show all stocks'
      })
    });
    
    const data1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    console.log(`Success: ${data1.success}`);
    if (data1.success) {
      console.log(`Found ${data1.count} stocks\n`);
    } else {
      console.log(`Error: ${data1.message}\n`);
    }
    
    // Now test the problematic query
    console.log('2. Testing: "Companies with 4 consecutive profitable quarters in the last 12 months"');
    const response2 = await fetch('http://localhost:5000/api/screener/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTY0MjQ2NDAwMH0.test'
      },
      body: JSON.stringify({
        query: 'Companies with 4 consecutive profitable quarters in the last 12 months'
      })
    });
    
    const data2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log(`Success: ${data2.success}`);
    
    if (data2.success) {
      console.log(`Found ${data2.count} companies`);
      console.log('Generated SQL:', data2.sql);
    } else {
      console.log(`Error: ${data2.message}`);
      console.log('Details:', JSON.stringify(data2, null, 2));
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testAPI();
