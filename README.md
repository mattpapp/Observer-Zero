# Observer Zero

A website that exists only when someone is watching it.

## Concept

Observer Zero is an interactive web experience that awakens only through collective attention. When you load it, you become Observer #1, and the site begins to come alive with subtle animations and ambient sound. The more people that view it simultaneously, the more it awakens—visually, musically, and thematically.

At different observer thresholds (3, 5, 10, 20, 50, 100, 200, 500, 1000, 5000), new visual and audio elements emerge, and secret messages may appear. There are no usernames, no chat, no visible crowd—you simply feel the presence of others through the site's response to collective attention.

If no one is watching the site, it powers down to a dormant state with a simple message: "This place lives only through attention."

## Visual Experience

As the observer count increases, the visual experience becomes dramatically more impressive:

### Low Observer Count (5)
<img width="1491" alt="Screenshot 2025-04-09 at 17 05 53" src="https://github.com/user-attachments/assets/b2884df5-e08c-4fec-ade5-e139e9d32d66" />


### Medium Observer Count (327)
<img width="1496" alt="Screenshot 2025-04-09 at 17 10 14" src="https://github.com/user-attachments/assets/7984669e-28c4-411e-8a3f-f9f1b781392c" />


### High Observer Count (5,327)
<img width="1492" alt="Screenshot 2025-04-09 at 17 27 24" src="https://github.com/user-attachments/assets/71f9e541-7d3f-4cf4-ad20-1d0949b67091" />



## Technical Features

- Real-time observer awareness using WebSockets (Socket.io)
- Dynamic visual effects with Canvas API that scale with observer count:
  - Particle systems that increase in complexity
  - Vortex, galaxy spiral, and starburst effects at high thresholds
  - Connection networks that expand and glow
- Ambient, generative audio using Web Audio API
- Responsive design that works on all devices
- Inactivity detection to ensure only active observers are counted
- Performance optimizations for high observer counts

## Setup and Installation

1. Clone this repository:
   ```
   git clone https://github.com/mattpapp/observer-zero.git
   cd observer-zero
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

5. For testing different observer counts, visit:
   ```
   http://localhost:3000/testpanel.html
   ```

## Load Testing

To experience Observer Zero with thousands of simulated observers:

1. Make sure the server is running
2. In a separate terminal, run:
   ```
   npm run load-test
   ```
3. Follow the on-screen menu to add/remove observers
4. Select option 1 to add 5000 observers gradually
5. Return to your browser to see the experience transform

The load test script provides a simple way to test the site with high observer counts without needing thousands of real users.

## Deployment

To deploy Observer Zero to a public server:

1. Set up a Node.js environment on your hosting provider
2. Clone the repository to your server
3. Install dependencies with `npm install`
4. Use a process manager like PM2 to keep the application running:
   ```
   npm install -g pm2
   pm2 start server.js
   ```
5. Set up a reverse proxy (Nginx or Apache) to forward requests to your Node.js application

## Project Structure

- `server.js` - Main server file handling WebSockets and serving static files
- `public/` - Frontend assets
  - `index.html` - Main page
  - `app.js` - Core application logic and WebSocket handling
  - `visuals.js` - Visual effects that scale with observer count
  - `audio.js` - Ambient audio generation
  - `styles.css` - Styling
  - `testpanel.html` - Control panel for testing different observer counts

## Contributing

Feel free to open issues or submit pull requests to enhance Observer Zero with new features or improvements.

## License

MIT 
