// Observer Zero - Audio Effects

// Audio context and nodes
let audioContext;
let masterGain;
let oscBank = [];
let noiseNode;
let noiseGain;
let compressor;

// Configuration
const audioConfig = {
  baseFrequencies: [196, 294, 392, 494], // Base frequencies (G3, D4, G4, B4)
  harmonyFrequencies: [220, 330, 440, 587], // Additional frequencies at higher thresholds (A3, E4, A4, D5)
  maxVolume: 0.2,            // Maximum master volume
  fadeTime: 1.0,             // Fade in/out time in seconds
  noiseFilterFreq: 200,      // Initial noise filter frequency
  maxNoiseFilterFreq: 2000,  // Maximum noise filter frequency
  baseNoiseLevel: 0.001,     // Base white noise level
  maxNoiseLevel: 0.03,       // Maximum white noise level
  pulseSpeed: 4,             // Pulse duration in seconds
  pulseIntensity: 0.3,       // How much the pulse affects sounds
  startDelay: 3              // Delay before starting audio (seconds)
};

// Current state
let currentThreshold = 0;
let isAudioActive = false;
let userInteracted = false;
let startTimeout;

// Initialize the audio system
function initAudio() {
  // Wait for user interaction before initializing audio
  // (required by browsers for autoplay policy)
  setupInteractionListeners();
}

// Set up listeners to detect user interaction
function setupInteractionListeners() {
  // These events will trigger audio initialization
  const interactionEvents = ['click', 'touchstart', 'keydown'];
  
  const handleInteraction = () => {
    if (!userInteracted) {
      userInteracted = true;
      
      // Remove event listeners once triggered
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
      
      // Initialize audio after first user interaction
      setupAudioContext();
    }
  };
  
  // Add event listeners
  interactionEvents.forEach(event => {
    document.addEventListener(event, handleInteraction);
  });
}

// Set up the audio context and nodes
function setupAudioContext() {
  // Create audio context
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create master gain node
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0; // Start silent
  
  // Create compressor for overall sound
  compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  
  // Connect master to compressor to output
  masterGain.connect(compressor);
  compressor.connect(audioContext.destination);
  
  // Create noise node
  createNoiseNode();
  
  console.log('Audio system initialized');
}

// Create white noise generator
function createNoiseNode() {
  // Create nodes
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  // Fill the buffer with noise
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  // Create buffer source
  noiseNode = audioContext.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;
  
  // Create filter for noise
  const noiseFilter = audioContext.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = audioConfig.noiseFilterFreq;
  noiseFilter.Q.value = 1;
  
  // Create gain for noise
  noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0;
  
  // Connect noise source -> filter -> gain -> master
  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  
  // Start the noise source
  noiseNode.start(0);
}

// Create oscillator bank based on threshold
function createOscillators(threshold) {
  // Clear any existing oscillators
  oscBank.forEach(osc => {
    if (osc.oscillator) {
      osc.oscillator.stop();
    }
  });
  oscBank = [];
  
  // Base frequencies always present
  audioConfig.baseFrequencies.forEach((freq, i) => {
    // Slight detuning for movement
    const detune = Math.random() * 10 - 5;
    createOscillator(freq, detune, 0.05 + (i % 2 ? 0.01 : 0));
  });
  
  // Add harmony frequencies at higher thresholds
  if (threshold >= 3) {
    audioConfig.harmonyFrequencies.forEach((freq, i) => {
      if (threshold >= (i + 1) * 3) { // Add more harmonies as threshold increases
        const detune = Math.random() * 10 - 5;
        createOscillator(freq, detune, 0.03 + (i % 2 ? 0.01 : 0));
      }
    });
  }
  
  // Add some higher harmonics at the highest thresholds
  if (threshold >= 10) {
    const highFreq = audioConfig.baseFrequencies[Math.floor(Math.random() * audioConfig.baseFrequencies.length)] * 2;
    createOscillator(highFreq, Math.random() * 10 - 5, 0.02);
  }
}

// Create a single oscillator
function createOscillator(frequency, detune, volume) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  // Random oscillator type for variety
  const types = ['sine', 'triangle'];
  oscillator.type = types[Math.floor(Math.random() * types.length)];
  
  // Set frequency and detune
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  
  // Set initial volume
  gain.gain.value = 0;
  
  // Fade in the oscillator
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(
    volume, 
    audioContext.currentTime + audioConfig.fadeTime
  );
  
  // Connect oscillator to its gain then to master
  oscillator.connect(gain);
  gain.connect(masterGain);
  
  // Start the oscillator
  oscillator.start();
  
  // Save reference to the oscillator
  oscBank.push({
    oscillator,
    gain,
    baseVolume: volume,
    frequency,
    phase: Math.random() * Math.PI * 2
  });
  
  return oscillator;
}

// Update oscillator pulse phases
function updateOscillatorPhases() {
  oscBank.forEach((osc, i) => {
    // Update phase
    osc.phase += 0.01;
    if (osc.phase > Math.PI * 2) {
      osc.phase -= Math.PI * 2;
    }
    
    // Calculate pulse factor
    const pulseFactor = 1 + Math.sin(osc.phase) * audioConfig.pulseIntensity;
    
    // Apply to gain
    const targetVolume = osc.baseVolume * pulseFactor * (currentThreshold > 0 ? 1 : 0);
    osc.gain.gain.setTargetAtTime(
      targetVolume,
      audioContext.currentTime,
      0.1
    );
  });
  
  // Update noise level with pulse
  if (noiseGain) {
    const noisePulse = 0.5 + Math.sin(Date.now() / 1000) * 0.5;
    const targetNoiseLevel = calculateNoiseLevel() * noisePulse;
    noiseGain.gain.setTargetAtTime(
      targetNoiseLevel,
      audioContext.currentTime,
      0.2
    );
  }
}

// Calculate noise level based on threshold
function calculateNoiseLevel() {
  if (currentThreshold <= 0) return 0;
  
  // Map threshold to a 0-1 range for noise level
  const thresholdLevels = [0, 1, 3, 5, 10, 20, 50];
  const maxLevel = thresholdLevels.length - 1;
  
  let level = 0;
  for (let i = 1; i < thresholdLevels.length; i++) {
    if (currentThreshold >= thresholdLevels[i]) {
      level = i;
    } else {
      break;
    }
  }
  
  // Normalize to 0-1 range
  const normalizedLevel = level / maxLevel;
  
  // Map to noise level range
  return audioConfig.baseNoiseLevel + normalizedLevel * (audioConfig.maxNoiseLevel - audioConfig.baseNoiseLevel);
}

// Start audio ambient noise
function startAmbientAudio() {
  if (!audioContext) return;
  
  // Clear any existing timeout
  if (startTimeout) {
    clearTimeout(startTimeout);
  }
  
  // Short delay before starting audio
  startTimeout = setTimeout(() => {
    // Make sure we have oscillators
    if (oscBank.length === 0) {
      createOscillators(currentThreshold);
    }
    
    // Fade in master volume
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(
      audioConfig.maxVolume,
      audioContext.currentTime + audioConfig.fadeTime
    );
    
    // Start update loop
    startAudioUpdateLoop();
    
    isAudioActive = true;
  }, audioConfig.startDelay * 1000);
}

// Stop ambient audio
function stopAmbientAudio() {
  if (!audioContext || !isAudioActive) return;
  
  // Fade out master volume
  masterGain.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
  masterGain.gain.linearRampToValueAtTime(
    0,
    audioContext.currentTime + audioConfig.fadeTime
  );
  
  isAudioActive = false;
}

// Start the loop to update audio parameters
function startAudioUpdateLoop() {
  // Update once every 100ms
  setInterval(() => {
    if (isAudioActive) {
      updateOscillatorPhases();
    }
  }, 100);
}

// Update audio based on threshold
window.updateAudio = function(threshold, observers) {
  // Cache current threshold
  currentThreshold = threshold;
  
  // Check if we need to start or stop audio
  if (threshold > 0 && !isAudioActive && userInteracted) {
    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Start ambient sound
    startAmbientAudio();
  } else if (threshold === 0 && isAudioActive) {
    // Stop ambient sound
    stopAmbientAudio();
  }
  
  // Update oscillators for the new threshold
  if (threshold > 0 && userInteracted && audioContext) {
    // Recreate oscillators for the new threshold
    createOscillators(threshold);
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAudio); 