// Observer Zero - Visual Effects

// Canvas and context
let canvas;
let ctx;
let particles = [];
let animationFrame;
let currentIntensity = 0;
let highObserverEffects = {
  galaxyPoints: [],
  starburstActive: false,
  starburstProgress: 0,
  vortexAngle: 0
};

// Configuration
const config = {
  particleCount: 50,
  particleBaseSize: 2,
  particleAddedSize: 0.5,
  particleBaseSpeed: 0.2,
  particleAddedSpeed: 0.1,
  connectionDistance: 100,
  connectionBaseOpacity: 0.2,
  connectionAddedOpacity: 0.05,
  baseHue: 160, // Cyan/teal base
  additionalHues: [140, 180, 210, 240, 270, 300, 330], // More color variations for higher thresholds
  pulseSpeed: 0.02,
  fadeSpeed: 0.05,
  // New performance settings
  maxParticles: 500, // Increased from 250 for more impressive visuals
  connectionSkipFactor: 1, // Will be increased with higher observer counts
  throttleFrames: false, // For very high counts
  // Special effects for high observer counts
  useGlowShadows: true,
  useCircularWave: false,
  useVortex: false,
  useStarburst: false,
  useGalaxyEffect: false,
  useColorShift: false
};

// Initialize the visual effects
function initVisuals() {
  // Get the canvas element
  canvas = document.getElementById('awareness-canvas');
  if (!canvas) return;
  
  // Set canvas size to full window
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Get the drawing context
  ctx = canvas.getContext('2d');
  
  // Create initial particles
  createParticles(config.particleCount);
  
  // Handle window resize
  window.addEventListener('resize', onResize);
  
  // Start animation
  startAnimation();
}

// Create particles
function createParticles(count) {
  particles = [];
  // Cap the particle count for performance
  const actualCount = Math.min(count, config.maxParticles);
  
  for (let i = 0; i < actualCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * config.particleBaseSpeed,
      vy: (Math.random() - 0.5) * config.particleBaseSpeed,
      size: config.particleBaseSize + Math.random() * config.particleAddedSize,
      color: getParticleColor(currentIntensity),
      phase: Math.random() * Math.PI * 2,
      highlightProgress: 0
    });
  }
}

// Get particle color based on threshold intensity
function getParticleColor(intensity, particleIndex = 0) {
  // Base hue
  let hue = config.baseHue;
  
  // As intensity increases, introduce more color variation
  if (intensity > 0.3) {
    // Randomly select from additional hues
    const hueIndex = Math.floor(Math.random() * config.additionalHues.length);
    if (Math.random() < intensity - 0.3) {
      hue = config.additionalHues[hueIndex];
    }
  }
  
  // For high intensity (5000 level), cycle through colors
  if (config.useColorShift && intensity > 0.9) {
    const time = Date.now() / 1000;
    const particleOffset = particleIndex * 0.02;
    hue = (hue + Math.sin(time + particleOffset) * 60) % 360;
  }
  
  // Saturation and lightness also affected by intensity
  const saturation = 80 + Math.random() * 20; // 80-100%
  const lightness = 50 + intensity * 30; // 50-80% - increased max lightness
  
  // Increased opacity for more vibrancy
  const opacity = 0.3 + intensity * 0.7;
  
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
}

// Update visuals based on threshold
window.updateVisuals = function(threshold, observers) {
  // Map threshold to a visual intensity between 0 and 1
  const newIntensity = mapThresholdToIntensity(threshold);
  
  // Smoothly transition to new intensity
  animateIntensityChange(newIntensity);
  
  // Performance adaptations for high observer counts
  adaptToObserverCount(observers);
  
  // Add more particles based on observer count, with higher cap for high thresholds
  const maxParticlesForThreshold = threshold >= 5000 ? 500 : 
                                 threshold >= 1000 ? 400 : 
                                 threshold >= 500 ? 300 : 
                                 config.particleCount;
  
  const targetParticleCount = Math.min(
    config.particleCount + Math.min(observers, 400),
    maxParticlesForThreshold
  );
  
  adjustParticleCount(targetParticleCount);
  
  // Enable special effects at high thresholds
  config.useCircularWave = threshold >= 500;
  config.useVortex = threshold >= 1000;
  config.useStarburst = threshold >= 1000;
  config.useGalaxyEffect = threshold >= 5000;
  config.useColorShift = threshold >= 5000;
  
  // Special one-time effects on threshold transitions
  if (threshold >= 5000 && !highObserverEffects.starburstActive) {
    triggerStarburst();
  }
  
  // Generate galaxy effect points for 5000+ observers
  if (threshold >= 5000 && highObserverEffects.galaxyPoints.length === 0) {
    generateGalaxyPoints();
  }
};

// Trigger a starburst animation
function triggerStarburst() {
  highObserverEffects.starburstActive = true;
  highObserverEffects.starburstProgress = 0;
  
  // Highlight random particles one by one
  let delay = 0;
  const randomParticles = shuffleArray([...Array(particles.length).keys()]);
  const maxHighlight = Math.min(100, particles.length);
  
  for (let i = 0; i < maxHighlight; i++) {
    const index = randomParticles[i];
    delay += 20;
    
    setTimeout(() => {
      if (particles[index]) {
        particles[index].highlightProgress = 1;
      }
    }, delay);
  }
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate points for the galaxy effect
function generateGalaxyPoints() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const numPoints = 500;
  const spiralTightness = 0.1;
  const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
  
  for (let i = 0; i < numPoints; i++) {
    // Spiral equation
    const angle = i * 0.1;
    const radius = angle * spiralTightness * maxRadius / (Math.PI * 2);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    highObserverEffects.galaxyPoints.push({
      x, y,
      size: 1 + Math.random(),
      hue: (config.baseHue + i * 0.7) % 360,
      opacity: 0.5 + Math.random() * 0.5,
      angle
    });
  }
}

// Adapt visual performance based on observer count
function adaptToObserverCount(count) {
  // Performance adjustments for high observer counts
  if (count > 3000) {
    config.connectionSkipFactor = 5;  // Check only 1/5 of connections
    config.throttleFrames = true;     // Skip frames
  } else if (count > 1000) {
    config.connectionSkipFactor = 3;  // Check only 1/3 of connections
    config.throttleFrames = false;
  } else if (count > 500) {
    config.connectionSkipFactor = 2;  // Check only 1/2 of connections
    config.throttleFrames = false;
  } else {
    config.connectionSkipFactor = 1;  // Check all connections
    config.throttleFrames = false;
  }
}

// Map threshold value to a visual intensity
function mapThresholdToIntensity(threshold) {
  const thresholdLevels = [0, 1, 3, 5, 10, 20, 50, 100, 200, 500, 1000, 5000];
  const maxIndex = thresholdLevels.length - 1;
  
  // Find where threshold fits in the levels
  let index = 0;
  while (index < maxIndex && threshold >= thresholdLevels[index + 1]) {
    index++;
  }
  
  // Calculate position between the two surrounding levels
  if (index < maxIndex) {
    const lowerLevel = thresholdLevels[index];
    const upperLevel = thresholdLevels[index + 1];
    const range = upperLevel - lowerLevel;
    const position = threshold - lowerLevel;
    
    // Map to a 0-1 scale
    return (index + (position / range)) / maxIndex;
  }
  
  return 1.0; // Max intensity
}

// Smoothly animate to new intensity
function animateIntensityChange(targetIntensity) {
  const animate = () => {
    if (Math.abs(currentIntensity - targetIntensity) < 0.01) {
      currentIntensity = targetIntensity;
      return;
    }
    
    // Ease toward target
    currentIntensity += (targetIntensity - currentIntensity) * config.fadeSpeed;
    
    // Continue animation
    requestAnimationFrame(animate);
  };
  
  animate();
}

// Adjust particle count
function adjustParticleCount(targetCount) {
  const currentCount = particles.length;
  
  if (targetCount > currentCount) {
    // Add particles
    for (let i = 0; i < targetCount - currentCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (config.particleBaseSpeed + config.particleAddedSpeed * currentIntensity),
        vy: (Math.random() - 0.5) * (config.particleBaseSpeed + config.particleAddedSpeed * currentIntensity),
        size: config.particleBaseSize + Math.random() * config.particleAddedSize * (1 + currentIntensity),
        color: getParticleColor(currentIntensity),
        phase: Math.random() * Math.PI * 2
      });
    }
  } else if (targetCount < currentCount) {
    // Remove particles
    particles.splice(targetCount, currentCount - targetCount);
  }
}

// Frame counter for throttling
let frameCount = 0;

// Animation loop
function animate() {
  // For high observer counts, throttle frame rate by skipping frames
  if (config.throttleFrames) {
    frameCount++;
    if (frameCount % 2 !== 0) {  // Skip every other frame
      animationFrame = requestAnimationFrame(animate);
      return;
    }
  }
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background glow if active
  if (currentIntensity > 0) {
    drawBackgroundGlow();
  }
  
  // Draw galaxy effect for 5000+ observers
  if (config.useGalaxyEffect) {
    drawGalaxyEffect();
  }
  
  // Update and draw particles
  updateParticles();
  
  // Draw connections between particles
  if (currentIntensity > 0) {
    drawConnections();
  }
  
  // Draw special effects for high observer counts
  if (config.useCircularWave) {
    drawCircularWave();
  }
  
  // Draw vortex effect for 1000+ observers
  if (config.useVortex) {
    drawVortex();
  }
  
  // Draw starburst effect for 1000+ observers if active
  if (config.useStarburst && highObserverEffects.starburstActive) {
    updateStarburst();
  }
  
  // Request next frame
  animationFrame = requestAnimationFrame(animate);
}

// Draw galaxy spiral effect for 5000+ observers
function drawGalaxyEffect() {
  const time = Date.now() * 0.0005;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  highObserverEffects.galaxyPoints.forEach((point, i) => {
    // Rotate points around center
    const rotationSpeed = 0.02;
    const angle = point.angle + time * rotationSpeed;
    const distance = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
    
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    // Pulsing effect
    const pulseScale = 1 + Math.sin(time * 2 + i * 0.1) * 0.2;
    const size = point.size * pulseScale;
    
    // Color cycling
    const hue = (point.hue + time * 20) % 360;
    
    // Draw point
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${point.opacity})`;
    ctx.fill();
    
    // Add glow
    ctx.shadowBlur = 5;
    ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.5)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

// Draw vortex effect for 1000+ observers
function drawVortex() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
  
  // Update vortex angle
  highObserverEffects.vortexAngle += 0.01;
  
  // Draw multiple vortex rings
  for (let i = 0; i < 5; i++) {
    const radius = maxRadius * (0.2 + i * 0.2);
    const segments = 100;
    const angleOffset = highObserverEffects.vortexAngle + i * (Math.PI / 10);
    
    ctx.beginPath();
    
    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments) * Math.PI * 2 + angleOffset;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.strokeStyle = `hsla(${(config.baseHue + i * 30) % 360}, 80%, 60%, ${0.1 + i * 0.05})`;
    ctx.lineWidth = 2 - i * 0.3;
    ctx.stroke();
  }
}

// Update and draw starburst effect
function updateStarburst() {
  if (highObserverEffects.starburstProgress < 1) {
    highObserverEffects.starburstProgress += 0.005;
    
    // Draw expanding circles
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.max(canvas.width, canvas.height);
    const progress = highObserverEffects.starburstProgress;
    
    // Multiple rings with different colors
    for (let i = 0; i < 5; i++) {
      const radius = maxRadius * progress * (0.6 + i * 0.1);
      const opacity = Math.max(0, 0.8 - progress * 1.2) * (1 - i * 0.1);
      
      if (opacity <= 0) continue;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${(config.baseHue + i * 30) % 360}, 80%, 70%, ${opacity})`;
      ctx.lineWidth = 5 - i;
      ctx.stroke();
    }
  } else {
    highObserverEffects.starburstActive = false;
  }
  
  // Update particle highlight effects
  particles.forEach(particle => {
    if (particle.highlightProgress > 0) {
      particle.highlightProgress -= 0.01;
    }
  });
}

// Draw background glow effect
function drawBackgroundGlow() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.max(canvas.width, canvas.height);
  
  // Pulse effect - intensity oscillates with time
  const pulseIntensity = 0.2 + Math.sin(Date.now() * 0.001) * 0.1;
  
  // Create gradient
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, maxRadius / 2
  );
  
  // Enhanced colors based on current intensity
  let glow1, glow2;
  
  if (currentIntensity > 0.9) { // 5000+ observers
    const time = Date.now() * 0.001;
    // Shift between multiple colors for highest level
    const shiftHue1 = (config.baseHue + Math.sin(time * 0.2) * 30) % 360;
    const shiftHue2 = (config.baseHue + 180 + Math.cos(time * 0.3) * 30) % 360;
    
    glow1 = `hsla(${shiftHue1}, 70%, 40%, ${pulseIntensity * 0.3})`;
    glow2 = `hsla(${shiftHue2}, 80%, 30%, ${pulseIntensity * 0.15})`;
  } else if (currentIntensity > 0.7) { // 1000+ observers
    glow1 = `hsla(${config.baseHue}, 80%, 40%, ${pulseIntensity * 0.25})`;
    glow2 = `hsla(${config.baseHue}, 90%, 30%, ${pulseIntensity * 0.12})`;
  } else if (currentIntensity > 0.5) { // 500+ observers
    glow1 = `hsla(${config.baseHue}, 70%, 40%, ${pulseIntensity * 0.2})`;
    glow2 = `hsla(${config.baseHue}, 80%, 30%, ${pulseIntensity * 0.1})`;
  } else {
    glow1 = `hsla(${config.baseHue}, 70%, 40%, ${pulseIntensity * 0.1})`;
    glow2 = `hsla(${config.baseHue}, 80%, 30%, ${pulseIntensity * 0.05})`;
  }
  
  gradient.addColorStop(0, glow1);
  gradient.addColorStop(0.5, glow2);
  gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
  
  // Fill with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Update and draw particles
function updateParticles() {
  particles.forEach((particle, index) => {
    let vx = particle.vx;
    let vy = particle.vy;
    
    // For 1000+ observers, add vortex movement to particles
    if (config.useVortex && currentIntensity > 0.7) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = Math.min(canvas.width, canvas.height) * 0.5;
      
      if (distance < maxDistance) {
        const angle = Math.atan2(dy, dx);
        const vortexStrength = 0.05 * (1 - distance / maxDistance);
        
        // Tangential velocity for vortex effect
        vx += Math.cos(angle + Math.PI/2) * vortexStrength;
        vy += Math.sin(angle + Math.PI/2) * vortexStrength;
      }
    }
    
    // Update position
    particle.x += vx * (1 + currentIntensity * 2); // Faster movement at high intensity
    particle.y += vy * (1 + currentIntensity * 2);
    
    // Pulse size with time and intensity
    const pulseFactor = 1 + Math.sin(particle.phase + Date.now() * 0.002) * 0.3 * currentIntensity;
    let size = particle.size * pulseFactor;
    
    // Highlight effect for starburst
    if (particle.highlightProgress > 0) {
      size *= 2;
    }
    
    // Wrap around edges
    if (particle.x < -size) particle.x = canvas.width + size;
    if (particle.x > canvas.width + size) particle.x = -size;
    if (particle.y < -size) particle.y = canvas.height + size;
    if (particle.y > canvas.height + size) particle.y = -size;
    
    // Update phase for pulse effect
    particle.phase += config.pulseSpeed;
    
    // Determine color based on intensity and highlight
    let particleColor = particle.color;
    if (particle.highlightProgress > 0) {
      // White flash for highlighted particles
      const highlightOpacity = Math.min(1, particle.highlightProgress * 2);
      particleColor = `hsla(0, 0%, 100%, ${highlightOpacity})`;
    } else if (config.useColorShift && currentIntensity > 0.8) {
      // For 5000+ observers, update colors over time
      particleColor = getParticleColor(currentIntensity, index);
    }
    
    // Draw particle
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    ctx.fillStyle = particleColor;
    ctx.fill();
    
    // Add glow effect for high intensity
    if (config.useGlowShadows && currentIntensity > 0.6) {
      const glowSize = 5 + currentIntensity * 10; // Bigger glow for higher thresholds
      ctx.shadowBlur = glowSize;
      ctx.shadowColor = particleColor;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });
}

// Draw connections between nearby particles
function drawConnections() {
  const connectionOpacity = config.connectionBaseOpacity + config.connectionAddedOpacity * currentIntensity;
  const maxDistance = config.connectionDistance * (1 + currentIntensity * 2); // Increased connection distance for high thresholds
  const skipFactor = config.connectionSkipFactor;
  
  for (let i = 0; i < particles.length; i += skipFactor) {
    for (let j = i + skipFactor; j < particles.length; j += skipFactor) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distanceSquared = dx * dx + dy * dy;
      const maxDistanceSquared = maxDistance * maxDistance;
      
      // Performance: Use squared distance to avoid expensive sqrt calculation
      if (distanceSquared < maxDistanceSquared) {
        // Calculate opacity based on distance
        const distance = Math.sqrt(distanceSquared); // Only calculate sqrt when needed
        const opacity = (1 - distance / maxDistance) * connectionOpacity;
        
        // Advanced connection styling for high thresholds
        let connectionStyle;
        if (currentIntensity > 0.9) {
          // Rainbow connections for 5000+ observers
          const time = Date.now() * 0.001;
          const hue = (config.baseHue + (i * 3) + time * 20) % 360;
          connectionStyle = `hsla(${hue}, 80%, 60%, ${opacity * 1.5})`;
        } else if (currentIntensity > 0.7) {
          // Brighter connections for 1000+ observers
          connectionStyle = `hsla(${config.baseHue}, 80%, 60%, ${opacity * 1.2})`;
        } else {
          // Default connections
          connectionStyle = `hsla(${config.baseHue}, 80%, 60%, ${opacity})`;
        }
        
        // Draw line between particles
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = connectionStyle;
        ctx.lineWidth = 1 * currentIntensity;
        
        // Add glow to connections at high thresholds
        if (currentIntensity > 0.8) {
          ctx.shadowBlur = 3;
          ctx.shadowColor = connectionStyle;
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }
}

// Draw circular wave effect for 500+ observers
function drawCircularWave() {
  if (currentIntensity < 0.5) return;
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const time = Date.now() * 0.001;
  
  // Multiple expanding circles
  const waveCount = currentIntensity > 0.9 ? 7 : // More waves for 5000+
                   currentIntensity > 0.7 ? 5 : // More waves for 1000+
                   3; // Base for 500+
  
  for (let i = 0; i < waveCount; i++) {
    const speed = 0.2 + i * 0.1;
    const maxSize = Math.min(canvas.width, canvas.height) / 2;
    const radius = (time * speed % 2.5) * maxSize / 2.5;
    const thickness = currentIntensity > 0.8 ? 3 : 2; // Thicker lines for higher thresholds
    
    // Fade out as they expand
    const baseOpacity = currentIntensity > 0.8 ? 0.4 : 0.3;
    const opacity = baseOpacity * (1 - (radius / (maxSize / 2.5)));
    
    if (opacity <= 0) continue;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    // Color variations based on threshold
    let hue;
    if (currentIntensity > 0.9) {
      // Rainbow waves for 5000+
      hue = (config.baseHue + i * 40 + time * 30) % 360;
    } else if (currentIntensity > 0.7) {
      // Varied hues for 1000+
      hue = (config.baseHue + i * 30) % 360;
    } else {
      // Basic hue variation for 500+
      hue = (config.baseHue + i * 20) % 360;
    }
    
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${opacity * currentIntensity})`;
    ctx.lineWidth = thickness;
    
    // Add glow at high thresholds
    if (currentIntensity > 0.8) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsla(${hue}, 80%, 60%, ${opacity * 0.5})`;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

// Handle window resize
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Start animation
function startAnimation() {
  animate();
}

// Stop animation
function stopAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initVisuals); 