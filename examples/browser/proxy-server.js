/**
 * Simple Express.js proxy server for LND REST API
 * This allows browser applications to connect to LND by handling CORS and authentication
 * 
 * Usage:
 * 1. Install dependencies: npm install express cors axios
 * 2. Set your LND_REST_API_URL and LND_MACAROON environment variables
 * 3. Run the server: node proxy-server.js
 * 4. Connect from browser to http://localhost:3000/lnd
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// LND configuration
const LND_REST_API_URL = process.env.LND_REST_API_URL || 'https://127.0.0.1:8080';
const LND_MACAROON = process.env.LND_MACAROON; // Hex-encoded macaroon

if (!LND_MACAROON) {
  console.error('⚠️ LND_MACAROON environment variable is not set. The proxy will not work.');
  console.error('Please set the LND_MACAROON environment variable to your hex-encoded macaroon.');
}

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Proxy all requests to LND REST API
app.use('/lnd', async (req, res) => {
  // Reconstruct the target URL by replacing /lnd with the actual LND API URL
  const targetUrl = `${LND_REST_API_URL}${req.url}`;
  
  console.log(`Proxying ${req.method} ${req.url} to ${targetUrl}`);
  
  try {
    // Forward the request to LND with the macaroon
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'Grpc-Metadata-macaroon': LND_MACAROON,
        'Content-Type': 'application/json'
      },
      // Bypass SSL verification - only for development! 
      // Remove this in production
      httpsAgent: new (require('https').Agent)({ 
        rejectUnauthorized: false 
      })
    });
    
    // Return the LND response
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request to LND:', error.message);
    
    // Forward the error response
    if (error.response) {
      res.status(error.response.status).json({
        error: true,
        message: error.message,
        details: error.response.data
      });
    } else {
      res.status(500).json({
        error: true,
        message: `Failed to connect to LND: ${error.message}`
      });
    }
  }
});

// WebSocket proxy endpoint placeholder
// For a complete implementation, you would need a WebSocket proxy library
app.get('/ws-proxy-info', (req, res) => {
  res.json({
    message: "WebSocket proxying is not implemented in this example.",
    recommendation: "For WebSocket support, consider using a dedicated WebSocket proxy library or service."
  });
});

// Serve the browser example
app.use(express.static(__dirname));

// Start the server
app.listen(port, () => {
  console.log(`
🚀 LND REST API proxy server running at http://localhost:${port}/lnd
📝 Make requests to this URL from your browser application
📄 Browser example available at http://localhost:${port}
  `);
}); 