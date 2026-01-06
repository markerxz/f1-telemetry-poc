#!/usr/bin/env node

/**
 * F1 25 Telemetry Server - SIMPLE POC (No external F1 package)
 * 
 * Listens for F1 UDP packets and displays raw data
 * Perfect for testing connection first!
 */

const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Configuration
const UDP_PORT = process.env.UDP_PORT || 20777;
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Store latest data
let latestData = {
    connected: false,
    timestamp: null,
    packetsReceived: 0,
    lastPacketTime: null,
    packetSize: 0
};

// HTTP Server - Serve dashboard
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'public', 'index-simple.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                // Fallback to inline HTML if file not found
                const html = `
<!DOCTYPE html>
<html>
<head>
    <title>F1 Telemetry - Connection Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #1a1a1a;
            color: #fff;
            padding: 40px;
            text-align: center;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #2a2a2a;
            padding: 40px;
            border-radius: 12px;
        }
        h1 {
            color: #e10600;
            margin-bottom: 30px;
        }
        .status {
            font-size: 24px;
            margin: 20px 0;
            padding: 20px;
            background: #333;
            border-radius: 8px;
        }
        .connected { color: #00ff00; }
        .disconnected { color: #ff4444; }
        .metric {
            font-size: 48px;
            font-weight: bold;
            margin: 20px 0;
        }
        .label {
            font-size: 14px;
            color: #888;
            text-transform: uppercase;
        }
        .instructions {
            margin-top: 40px;
            padding: 20px;
            background: #333;
            border-radius: 8px;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏎️ F1 25 Telemetry - Connection Test</h1>
        
        <div class="status">
            Status: <span id="status" class="disconnected">Waiting for data...</span>
        </div>
        
        <div class="label">Packets Received</div>
        <div class="metric" id="packets">0</div>
        
        <div class="label">Last Packet</div>
        <div id="lastPacket">Never</div>
        
        <div class="instructions">
            <h3>🎮 To Connect F1 25:</h3>
            <ol>
                <li>Open F1 25</li>
                <li>Go to: <strong>Settings → Telemetry Settings</strong></li>
                <li>Set:
                    <ul>
                        <li>UDP Telemetry: <strong>ON</strong></li>
                        <li>UDP IP: <strong>${HOST === '0.0.0.0' ? 'YOUR_VM_IP' : HOST}</strong></li>
                        <li>UDP Port: <strong>${UDP_PORT}</strong></li>
                        <li>Send Rate: <strong>60Hz</strong></li>
                    </ul>
                </li>
                <li>Start driving!</li>
            </ol>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://' + window.location.host);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            document.getElementById('status').textContent = data.connected ? 'Connected! 🟢' : 'Disconnected 🔴';
            document.getElementById('status').className = data.connected ? 'connected' : 'disconnected';
            document.getElementById('packets').textContent = data.packetsReceived.toLocaleString();
            document.getElementById('lastPacket').textContent = data.lastPacketTime || 'Never';
        };
        
        ws.onerror = () => {
            document.getElementById('status').textContent = 'WebSocket Error 🔴';
        };
    </script>
</body>
</html>`;
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(data);
            }
        });
    } else if (req.url === '/api/data') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(latestData));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    ws.send(JSON.stringify(latestData));
});

function broadcastData() {
    const message = JSON.stringify(latestData);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// UDP Server - Listen for F1 telemetry
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
    latestData.packetsReceived++;
    latestData.connected = true;
    latestData.timestamp = Date.now();
    latestData.lastPacketTime = new Date().toLocaleTimeString();
    latestData.packetSize = msg.length;
    
    console.log(`[UDP] Packet received from ${rinfo.address}:${rinfo.port} | Size: ${msg.length} bytes | Total: ${latestData.packetsReceived}`);
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     F1 25 Telemetry Server - Connection Test          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✓ HTTP Server:    http://${HOST}:${HTTP_PORT}`);
    console.log(`✓ WebSocket:      ws://${HOST}:${HTTP_PORT}`);
    console.log(`✓ UDP Listening:  ${address.address}:${address.port}`);
    console.log('');
    console.log('Waiting for F1 25 telemetry data...');
    console.log('');
});

udpServer.on('error', (err) => {
    console.error('[UDP] Error:', err.message);
    udpServer.close();
});

// Start servers
udpServer.bind(UDP_PORT, HOST);

server.listen(HTTP_PORT, HOST, () => {
    console.log(`Starting server on port ${HTTP_PORT}...`);
});

// Broadcast data every second
setInterval(() => {
    broadcastData();
    
    // Check if data is stale
    if (latestData.connected && Date.now() - latestData.timestamp > 5000) {
        latestData.connected = false;
        console.log('[Status] No telemetry for 5 seconds');
    }
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Shutdown] Closing servers...');
    udpServer.close();
    server.close();
    process.exit(0);
});

