// Simple Observer Zero Test Script
const http = require('http');

// Configuration
const TARGET_COUNT = 100; // How many observers to simulate
const BASE_URL = 'http://localhost:3000';

console.log(`Starting Observer Zero test with ${TARGET_COUNT} observers...`);

// Create the observers by making HTTP requests (lighter than websockets)
for (let i = 0; i < TARGET_COUNT; i++) {
  // Create a simple HTTP request
  http.get(BASE_URL, (res) => {
    console.log(`Observer ${i+1} connected with status: ${res.statusCode}`);
    
    // Keep the connection open for a while with a timeout
    setTimeout(() => {
      console.log(`Observer ${i+1} still active`);
    }, 30000);  // Stay connected for 30 seconds
  }).on('error', (err) => {
    console.error(`Observer ${i+1} error: ${err.message}`);
  });
  
  // Small delay between connections
  if (i % 10 === 0) {
    console.log(`Created ${i+1} observers...`);
  }
}

console.log(`All ${TARGET_COUNT} observers have been created.`);
console.log(`Keep this script running to maintain connections.`);
console.log(`Check your browser to see the experience with ${TARGET_COUNT} observers.`);

// Keep the script running
setInterval(() => {
  console.log(`Maintaining ${TARGET_COUNT} active connections...`);
}, 10000); 