// Observer Zero - Main Application Logic

// State variables
let myObserverNumber = 0;
let totalObservers = 0;
let currentThreshold = 0;
let isActive = false;
let socket;
let lastActivityTime = Date.now();
let inactiveTimeout;
let heartbeatInterval;
let formattedCount = '0';

// Add support for forced observer count (for testing)
let isForcedCount = false;
let forcedCountValue = 0;

// DOM elements
const dormantState = document.getElementById('dormant-state');
const activeState = document.getElementById('active-state');
const observerNumberElement = document.getElementById('observer-number');
const yourNumberElement = document.getElementById('your-number');
const observerMessage = document.getElementById('observer-message');
const secretMessages = document.getElementById('secret-messages');

// Messages that appear at different observer thresholds
const thresholdMessages = {
  1: "The space awakens to your presence.",
  3: "A collective awareness forms.",
  5: "The space begins to resonate with shared consciousness.",
  10: "A unique energy emerges from connected observers.",
  20: "The boundary between observation and creation blurs.",
  50: "A unified field of perception transcends individual observation.",
  100: "The collective consciousness expands beyond individual perception.",
  200: "The boundaries between observers begin to dissolve.",
  500: "A resonance field emerges, connecting all observers.",
  1000: "The system achieves quantum entanglement across all observers.",
  5000: "Complete synchronicity achieved. We are one mind now."
};

// Secret messages that appear at different thresholds
const secretThresholdMessages = {
  3: "When three observe, patterns emerge from chaos.",
  5: "The fifth observer completes the pentagram of awareness.",
  10: "Ten observers have unlocked hidden dimensions.",
  20: "Twenty minds connected reveal the forgotten message: 'You are not alone in the void.'",
  50: "The collective has reached critical mass. New realities become possible.",
  100: "One hundred observers can bend spacetime through shared intention.",
  200: "The veil grows thin as two hundred minds focus.",
  500: "Five hundred observers create a beacon visible across dimensions.",
  1000: "A thousand minds form a collective entity that transcends human thought.",
  5000: "Five thousand observers unlock the final code: 'We were always here, watching each other.'"
};

// Initialize the application
function init() {
  // Connect to the server via Socket.io
  socket = io({
    transports: ['websocket'],
    reconnectionAttempts: 5,
    timeout: 10000
  });
  
  // Set up event listeners
  setupSocketListeners();
  setupActivityTracking();
  setupForceCountListener();
  
  // Begin the heartbeat to show active observation
  startHeartbeat();
}

// Setup Socket.io event listeners
function setupSocketListeners() {
  // When connected to the server
  socket.on('connect', () => {
    console.log('Connected to Observer Zero');
  });
  
  // When disconnected from the server
  socket.on('disconnect', () => {
    console.log('Disconnected from Observer Zero');
    switchToDormantState();
  });
  
  // When first joining as an observer
  socket.on('observer:welcome', (data) => {
    myObserverNumber = data.observerNumber;
    totalObservers = data.totalObservers;
    
    yourNumberElement.textContent = formatNumber(myObserverNumber);
    updateObserverCount(totalObservers);
    
    // Switch to active state
    switchToActiveState();
  });
  
  // When total observer count changes
  socket.on('observer:update', (data) => {
    // Skip updates if using forced count
    if (isForcedCount) return;
    
    totalObservers = data.totalObservers;
    updateObserverCount(totalObservers);
    
    // If threshold changed, update visuals and messages
    if (data.threshold !== currentThreshold) {
      updateThreshold(data.threshold);
    }
    
    // If no observers, return to dormant state
    if (totalObservers === 0) {
      switchToDormantState();
    } else {
      switchToActiveState();
    }
  });
  
  // Heartbeat response to keep connection alive
  socket.on('observer:heartbeat-response', () => {
    // Reset inactivity timer
    lastActivityTime = Date.now();
  });
}

// Setup force count listener for testing
function setupForceCountListener() {
  // Listen for custom force-count event from test panel
  document.addEventListener('observer:force-count', (event) => {
    isForcedCount = true;
    forcedCountValue = event.detail.count;
    
    // Update display immediately
    updateObserverCount(forcedCountValue);
    
    // Update threshold based on forced count
    updateThreshold(getCurrentThreshold(forcedCountValue));
    
    console.log(`Force set observer count to ${forcedCountValue}`);
  });
}

// Get current threshold based on observer count
function getCurrentThreshold(count) {
  // Map thresholds
  const thresholds = [0, 1, 3, 5, 10, 20, 50, 100, 200, 500, 1000, 5000];
  
  // Find highest applicable threshold
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (count >= thresholds[i]) {
      return thresholds[i];
    }
  }
  return 0;
}

// Format large numbers with commas for readability
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Update the observer count display
function updateObserverCount(count) {
  // Format new count for display
  formattedCount = formatNumber(count);
  
  // Animate the count change only if it's a smaller number
  // For large numbers, just update directly for performance
  if (count < 100) {
    const currentCount = parseInt(observerNumberElement.textContent.replace(/,/g, ''));
    animateCountChange(currentCount, count);
  } else {
    observerNumberElement.textContent = formattedCount;
  }
  
  // Update the class based on number of digits for responsive sizing
  updateObserverNumberClass(count);
}

// Add appropriate class to observer number based on digit count
function updateObserverNumberClass(count) {
  // Remove existing digit classes
  observerNumberElement.classList.remove('digits-3', 'digits-4', 'digits-5');
  
  // Add class based on number of digits
  const digitCount = count.toString().length;
  
  if (digitCount >= 3 && digitCount < 4) {
    observerNumberElement.classList.add('digits-3');
  } else if (digitCount >= 4 && digitCount < 5) {
    observerNumberElement.classList.add('digits-4');
  } else if (digitCount >= 5) {
    observerNumberElement.classList.add('digits-5');
  }
}

// Animate count change with a subtle effect
function animateCountChange(from, to) {
  let start = null;
  const duration = 1000; // 1 second animation
  
  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    
    // Calculate current value using easing function
    const currentValue = Math.floor(from + (to - from) * easeOutQuad(progress));
    
    // Update the display
    observerNumberElement.textContent = formatNumber(currentValue);
    
    // Update class based on digits
    updateObserverNumberClass(currentValue);
    
    // Continue animation if not complete
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      observerNumberElement.textContent = formattedCount;
    }
  }
  
  window.requestAnimationFrame(step);
}

// Easing function for smooth animation
function easeOutQuad(t) {
  return t * (2 - t);
}

// Update the threshold level and trigger associated effects
function updateThreshold(threshold) {
  currentThreshold = threshold;
  
  // Update observer message
  if (thresholdMessages[threshold]) {
    observerMessage.textContent = thresholdMessages[threshold];
    fadeInElement(observerMessage);
  }
  
  // Show secret message if one exists for this threshold
  if (secretThresholdMessages[threshold]) {
    secretMessages.textContent = secretThresholdMessages[threshold];
    secretMessages.style.opacity = 1;
    
    // Fade out secret message after some time
    setTimeout(() => {
      secretMessages.style.opacity = 0;
    }, 10000); // Show for 10 seconds
  }
  
  // Trigger visual and audio changes for the new threshold
  if (window.updateVisuals) {
    window.updateVisuals(threshold, totalObservers);
  }
  
  if (window.updateAudio) {
    window.updateAudio(threshold, totalObservers);
  }
}

// Fade in an element
function fadeInElement(element) {
  element.style.opacity = 0;
  let opacity = 0;
  const interval = setInterval(() => {
    if (opacity < 0.6) {
      opacity += 0.05;
      element.style.opacity = opacity;
    } else {
      clearInterval(interval);
    }
  }, 50);
}

// Switch to active state
function switchToActiveState() {
  if (!isActive) {
    dormantState.classList.remove('active');
    activeState.classList.add('active');
    isActive = true;
  }
}

// Switch to dormant state
function switchToDormantState() {
  if (isActive) {
    activeState.classList.remove('active');
    dormantState.classList.add('active');
    isActive = false;
  }
}

// Setup activity tracking to detect when user is actively watching
function setupActivityTracking() {
  // Performance optimization: Use fewer event listeners for high observer counts
  // Just use the most essential ones
  document.addEventListener('mousemove', recordActivity, { passive: true });
  document.addEventListener('click', recordActivity, { passive: true });
  document.addEventListener('touchstart', recordActivity, { passive: true });
  
  // Check for inactivity every 5 seconds
  inactiveTimeout = setInterval(checkActivity, 5000);
}

// Record user activity
function recordActivity() {
  lastActivityTime = Date.now();
}

// Check if user is still active
function checkActivity() {
  const inactiveTime = Date.now() - lastActivityTime;
  
  // If inactive for more than 30 seconds, disconnect
  if (inactiveTime > 30000) {
    console.log('User inactive, disconnecting as an observer');
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }
}

// Start heartbeat to keep connection with server
function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('observer:heartbeat');
    }
  }, 15000); // Every 15 seconds
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 