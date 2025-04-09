require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Increase max listeners to prevent memory leak warnings with many connections
require('events').EventEmitter.defaultMaxListeners = 1000;

const app = express();
const server = http.createServer(app);

// Configure Socket.io for high connection counts
const io = socketIo(server, {
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket'],
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  connectTimeout: 5000,
  maxHttpBufferSize: 1e6
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Track active observers
let activeObservers = 0;
const OBSERVER_THRESHOLDS = [1, 3, 5, 10, 20, 50, 100, 200, 500, 1000, 5000];

// Performance optimization: throttle updates when many users are connected
const BROADCAST_THROTTLE_MS = 500; // Minimum time between broadcasts
let pendingUpdate = false;
let lastBroadcastTime = 0;
let broadcastTimeout = null;

// Debug mode for load testing
const DEBUG_MODE = process.env.DEBUG_MODE === 'true' || false;
const TESTING_MODE = process.env.TESTING_MODE === 'true' || false;

// Add HTTP request tracking for testing
app.use((req, res, next) => {
  // For our testing approach, count each HTTP request as an observer
  if (TESTING_MODE && req.path === '/') {
    // Increment observer count for testing
    activeObservers++;
    if (DEBUG_MODE || activeObservers % 10 === 0) {
      console.log(`HTTP Observer connected. Total: ${activeObservers}`);
    }
    
    // Update all clients
    throttledBroadcast();
    
    // When the connection closes, decrement the count
    req.on('close', () => {
      activeObservers = Math.max(0, activeObservers - 1);
      if (DEBUG_MODE || activeObservers % 10 === 0) {
        console.log(`HTTP Observer disconnected. Total: ${activeObservers}`);
      }
      throttledBroadcast();
    });
  }
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  // Increment observer count
  activeObservers++;
  if (DEBUG_MODE || activeObservers % 100 === 0) {
    console.log(`Socket Observer connected. Total: ${activeObservers}`);
  }
  
  // Send current state to the new observer
  socket.emit('observer:welcome', { 
    observerNumber: activeObservers,
    totalObservers: activeObservers
  });
  
  // Throttle broadcast updates when many users connect in rapid succession
  throttledBroadcast();
  
  // Handle observer becoming inactive
  socket.on('disconnect', () => {
    activeObservers = Math.max(0, activeObservers - 1);
    if (DEBUG_MODE || activeObservers % 100 === 0) {
      console.log(`Socket Observer disconnected. Total: ${activeObservers}`);
    }
    
    // Throttle broadcast updates
    throttledBroadcast();
  });
  
  // Handle heartbeat to ensure observer is still watching
  socket.on('observer:heartbeat', () => {
    // Reset the client's disconnect timer
    socket.emit('observer:heartbeat-response');
  });
});

// Throttle broadcasts to prevent performance issues with many simultaneous connections
function throttledBroadcast() {
  // If update already pending, don't schedule another one
  if (pendingUpdate) return;
  
  pendingUpdate = true;
  
  const currentTime = Date.now();
  const timeSinceLastBroadcast = currentTime - lastBroadcastTime;
  
  // For very high observer counts, throttle more aggressively
  const throttleTime = activeObservers > 1000 ? BROADCAST_THROTTLE_MS * 2 : BROADCAST_THROTTLE_MS;
  
  // If we've recently broadcasted, delay the next update
  if (timeSinceLastBroadcast < throttleTime) {
    const delay = throttleTime - timeSinceLastBroadcast;
    
    if (broadcastTimeout) {
      clearTimeout(broadcastTimeout);
    }
    
    broadcastTimeout = setTimeout(() => {
      executeBroadcast();
    }, delay);
  } else {
    // Otherwise broadcast immediately
    executeBroadcast();
  }
}

// Testing: Force a specific observer count (for demos)
app.get('/force-count/:count', (req, res) => {
  if (TESTING_MODE) {
    const requestedCount = parseInt(req.params.count, 10);
    if (!isNaN(requestedCount) && requestedCount >= 0) {
      activeObservers = requestedCount;
      console.log(`Forced observer count to: ${activeObservers}`);
      throttledBroadcast();
      res.send({ success: true, count: activeObservers });
    } else {
      res.status(400).send({ error: 'Invalid count parameter' });
    }
  } else {
    res.status(403).send({ error: 'Testing mode is disabled' });
  }
});

// Execute the actual broadcast to all clients
function executeBroadcast() {
  const threshold = getCurrentThreshold(activeObservers);
  
  // Log significant threshold changes
  if (activeObservers > 0 && OBSERVER_THRESHOLDS.includes(activeObservers)) {
    console.log(`*** THRESHOLD REACHED: ${activeObservers} observers ***`);
  }
  
  io.emit('observer:update', { 
    totalObservers: activeObservers,
    threshold: threshold
  });
  
  lastBroadcastTime = Date.now();
  pendingUpdate = false;
  broadcastTimeout = null;
}

// Determine current threshold level based on observer count
function getCurrentThreshold(count) {
  for (let i = OBSERVER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (count >= OBSERVER_THRESHOLDS[i]) {
      return OBSERVER_THRESHOLDS[i];
    }
  }
  return 0;
}

// Add memory usage monitoring (useful for high connection counts)
function logMemoryUsage() {
  const memUsage = process.memoryUsage();
  console.log(`Memory usage: 
    RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB, 
    Heap total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB, 
    Heap used: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB, 
    Active observers: ${activeObservers}`);
}

// Log memory usage every 30 seconds when high connection count
setInterval(() => {
  if (activeObservers > 100) {
    logMemoryUsage();
  }
}, 30000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Observer Zero is waiting for attention on port ${PORT}`);
  console.log(`Debug mode: ${DEBUG_MODE ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Testing mode: ${TESTING_MODE ? 'ENABLED' : 'DISABLED'}`);
}); 