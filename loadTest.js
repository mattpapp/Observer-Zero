// Observer Zero - Load Testing Script
const io = require('socket.io-client');
const readline = require('readline');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const MAX_CLIENTS = 5000;
const RAMP_UP_INTERVAL_MS = 10; // Time between client connections (ms)

// State
let connectedClients = 0;
let clients = [];
let isRamping = false;
let heartbeatIntervals = [];
let keepAliveInterval;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display menu
function showMenu() {
  console.log('\n===== Observer Zero Load Testing Tool =====');
  console.log('1. Simulate 5000 observers (ramp up gradually)');
  console.log('2. Set specific number of observers');
  console.log('3. Disconnect all observers');
  console.log('4. Show current status');
  console.log('5. Exit');
  console.log('==========================================');
  
  rl.question('Enter your choice (1-5): ', (answer) => {
    handleMenuChoice(answer);
  });
}

// Handle menu choice
function handleMenuChoice(choice) {
  switch (choice) {
    case '1':
      if (!isRamping) {
        console.log(`Starting ramp up to ${MAX_CLIENTS} observers...`);
        rampUpClients(MAX_CLIENTS);
      } else {
        console.log('Ramp up already in progress...');
      }
      setTimeout(showMenu, 500);
      break;
    
    case '2':
      rl.question('Enter number of observers to simulate: ', (num) => {
        const targetNumber = parseInt(num);
        if (isNaN(targetNumber) || targetNumber < 0) {
          console.log('Please enter a valid number');
        } else {
          console.log(`Setting observer count to ${targetNumber}...`);
          adjustClientCount(targetNumber);
        }
        setTimeout(showMenu, 500);
      });
      break;
    
    case '3':
      console.log('Disconnecting all observers...');
      disconnectAllClients();
      setTimeout(showMenu, 500);
      break;
    
    case '4':
      console.log(`Current status: ${connectedClients} observers connected`);
      checkAllConnections(); // Added: Check and report on actual connections
      setTimeout(showMenu, 500);
      break;
    
    case '5':
      disconnectAllClients();
      console.log('Exiting...');
      rl.close();
      process.exit(0);
      break;
    
    default:
      console.log('Invalid choice. Please try again.');
      setTimeout(showMenu, 500);
  }
}

// Connect a single client
function connectClient() {
  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 5000
  });
  
  socket.on('connect', () => {
    connectedClients++;
    updateStatus();
    
    // Simulate activity by moving the mouse
    socket.emit('observer:heartbeat');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
  });
  
  socket.on('disconnect', () => {
    connectedClients--;
    updateStatus();
    
    // Try to reconnect if disconnected unexpectedly
    if (clients.includes(socket)) {
      console.log("A client was disconnected, attempting to reconnect...");
      socket.connect();
    }
  });
  
  // Keep track of welcome and update messages
  socket.on('observer:welcome', (data) => {
    // Successfully joined as an observer
    console.log(`Observer welcome received: #${data.observerNumber} of ${data.totalObservers}`);
  });
  
  return socket;
}

// Start a shared heartbeat interval for all clients
function startSharedHeartbeat() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  // Send heartbeats for all connected clients every 10 seconds
  keepAliveInterval = setInterval(() => {
    let activeCount = 0;
    clients.forEach(socket => {
      if (socket && socket.connected) {
        socket.emit('observer:heartbeat');
        activeCount++;
      }
    });
    
    if (activeCount > 0 && activeCount % 100 === 0) {
      console.log(`Sent heartbeats to ${activeCount} active connections`);
    }
  }, 10000);
}

// Check all connections and report status
function checkAllConnections() {
  let activeConnections = 0;
  
  clients.forEach(socket => {
    if (socket && socket.connected) {
      activeConnections++;
    }
  });
  
  console.log(`\nCONNECTION CHECK: ${activeConnections} of ${clients.length} clients are actually connected`);
  
  if (activeConnections < clients.length) {
    console.log('Some connections may have been lost. Use option 2 to reset to your desired count.');
  }
}

// Ramp up to target number of clients
function rampUpClients(targetCount) {
  isRamping = true;
  
  const currentCount = clients.length;
  const connectionsToAdd = targetCount - currentCount;
  
  if (connectionsToAdd <= 0) {
    console.log('Already at or above target count, reducing...');
    adjustClientCount(targetCount);
    isRamping = false;
    return;
  }
  
  console.log(`Adding ${connectionsToAdd} observers with ${RAMP_UP_INTERVAL_MS}ms between connections`);
  
  // Start the shared heartbeat for all connections
  startSharedHeartbeat();
  
  let connected = 0;
  const startTime = Date.now();
  
  const interval = setInterval(() => {
    if (connected >= connectionsToAdd) {
      clearInterval(interval);
      console.log(`Ramp up complete. Added ${connected} observers in ${(Date.now() - startTime) / 1000} seconds.`);
      checkAllConnections();
      isRamping = false;
      return;
    }
    
    try {
      const socket = connectClient();
      clients.push(socket);
      connected++;
      
      // Log progress periodically
      if (connected % 100 === 0) {
        console.log(`Progress: ${connected}/${connectionsToAdd} observers connected`);
      }
    } catch (error) {
      console.error('Error connecting client:', error.message);
    }
  }, RAMP_UP_INTERVAL_MS);
}

// Adjust client count to target number
function adjustClientCount(targetCount) {
  const currentCount = clients.length;
  
  if (targetCount > currentCount) {
    // Need to add clients
    rampUpClients(targetCount);
  } else if (targetCount < currentCount) {
    // Need to remove clients
    const removeCount = currentCount - targetCount;
    console.log(`Removing ${removeCount} observers...`);
    
    for (let i = 0; i < removeCount; i++) {
      const socket = clients.pop();
      if (socket) {
        socket.disconnect();
      }
    }
    
    console.log(`Removed ${removeCount} observers. Current count: ${clients.length}`);
  } else {
    console.log(`Already at target count of ${targetCount}`);
  }
  
  // Make sure the shared heartbeat is running
  startSharedHeartbeat();
}

// Disconnect all clients
function disconnectAllClients() {
  console.log(`Disconnecting all ${clients.length} observers...`);
  
  // Clear the shared heartbeat interval
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  
  clients.forEach((socket) => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });
  
  clients = [];
  connectedClients = 0;
  
  console.log('All observers disconnected.');
}

// Update status display
function updateStatus() {
  process.stdout.write(`\rActive observers: ${connectedClients}`);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  disconnectAllClients();
  process.exit(0);
});

// Start the menu
console.log('Observer Zero Load Testing Tool');
console.log('------------------------------');
console.log('This tool will simulate thousands of observers on your local Observer Zero instance.');
console.log('Make sure your server is running before proceeding.');
console.log('');
showMenu(); 