#!/usr/bin/env node

/**
 * F1 25 Telemetry Server - Minimal POC
 * 
 * This server:
 * 1. Listens for F1 25 UDP telemetry on port 20777
 * 2. Parses telemetry data
 * 3. Broadcasts to web clients via WebSocket
 * 4. Serves a simple HTML dashboard
 */

const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { F1TelemetryClient } = require('f1-22-telemetry');

// Configuration
const UDP_PORT = process.env.UDP_PORT || 20777;
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Store latest telemetry data
let latestData = {
    connected: false,
    timestamp: null,
    speed: 0,
    gear: 0,
    rpm: 0,
    throttle: 0,
    brake: 0,
    steering: 0,
    drs: 0,
    currentLapTime: '0:00.000',
    lastLapTime: '0:00.000',
    sector1Time: null,
    sector2Time: null,
    trackName: 'Unknown',
    sessionType: 'Unknown',
    driverName: 'Unknown',
    lapNumber: 0,
    position: { x: 0, y: 0, z: 0 }
};

// Track ID to name mapping (F1 25)
const TRACK_NAMES = {
    0: 'Melbourne',
    1: 'Paul Ricard',
    2: 'Shanghai',
    3: 'Sakhir (Bahrain)',
    4: 'Catalunya',
    5: 'Monaco',
    6: 'Montreal',
    7: 'Silverstone',
    8: 'Hockenheim',
    9: 'Hungaroring',
    10: 'Spa',
    11: 'Monza',
    12: 'Singapore',
    13: 'Suzuka',
    14: 'Abu Dhabi',
    15: 'Texas',
    16: 'Brazil',
    17: 'Austria',
    18: 'Sochi',
    19: 'Mexico',
    20: 'Baku',
    21: 'Sakhir Short',
    22: 'Silverstone Short',
    23: 'Texas Short',
    24: 'Suzuka Short',
    25: 'Hanoi',
    26: 'Zandvoort',
    27: 'Imola',
    28: 'Portimão',
    29: 'Jeddah',
    30: 'Miami',
    31: 'Las Vegas',
    32: 'Losail'
};

// Session type mapping
const SESSION_TYPES = {
    0: 'Unknown',
    1: 'Practice 1',
    2: 'Practice 2',
    3: 'Practice 3',
    4: 'Short Practice',
    5: 'Qualifying 1',
    6: 'Qualifying 2',
    7: 'Qualifying 3',
    8: 'Short Qualifying',
    9: 'One Shot Qualifying',
    10: 'Race',
    11: 'Race 2',
    12: 'Race 3',
    13: 'Time Trial'
};

// Format milliseconds to lap time string
function formatLapTime(ms) {
    if (!ms || ms === 0) return '0:00.000';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// HTTP Server - Serve dashboard
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'public', 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading dashboard');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/api/data') {
        // REST API endpoint for current data
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
    console.log('[WebSocket] Client connected. Total clients:', wss.clients.size);
    
    // Send current data immediately
    ws.send(JSON.stringify(latestData));
    
    ws.on('close', () => {
        console.log('[WebSocket] Client disconnected. Total clients:', wss.clients.size);
    });
    
    ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error.message);
    });
});

// Broadcast data to all connected WebSocket clients
function broadcastData(data) {
    const message = JSON.stringify(data);
    let sentCount = 0;
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sentCount++;
        }
    });
    
    if (sentCount > 0) {
        console.log(`[WebSocket] Broadcasted to ${sentCount} client(s)`);
    }
}

// F1 Telemetry Client
const client = new F1TelemetryClient({ port: UDP_PORT });

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     F1 25 Telemetry Server - POC                       ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

// Session data
client.on('session', (data) => {
    const trackId = data.m_trackId;
    const sessionType = data.m_sessionType;
    
    latestData.trackName = TRACK_NAMES[trackId] || `Track ${trackId}`;
    latestData.sessionType = SESSION_TYPES[sessionType] || `Session ${sessionType}`;
    latestData.connected = true;
    latestData.timestamp = Date.now();
    
    console.log(`[Session] Track: ${latestData.trackName} | Type: ${latestData.sessionType}`);
});

// Lap data
client.on('lapData', (data) => {
    const playerData = data.m_lapData[data.m_header.m_playerCarIndex];
    
    if (playerData) {
        latestData.currentLapTime = formatLapTime(playerData.m_currentLapTimeInMS);
        latestData.lastLapTime = formatLapTime(playerData.m_lastLapTimeInMS);
        latestData.sector1Time = playerData.m_sector1TimeInMS ? formatLapTime(playerData.m_sector1TimeInMS) : null;
        latestData.sector2Time = playerData.m_sector2TimeInMS ? formatLapTime(playerData.m_sector2TimeInMS) : null;
        latestData.lapNumber = playerData.m_currentLapNum;
        latestData.connected = true;
        latestData.timestamp = Date.now();
        
        // Log lap completion
        if (playerData.m_lastLapTimeInMS > 0 && playerData.m_currentLapNum > 1) {
            console.log(`[Lap Complete] Lap ${playerData.m_currentLapNum - 1}: ${latestData.lastLapTime}`);
        }
    }
});

// Car telemetry
client.on('carTelemetry', (data) => {
    const playerData = data.m_carTelemetryData[data.m_header.m_playerCarIndex];
    
    if (playerData) {
        latestData.speed = Math.round(playerData.m_speed);
        latestData.gear = playerData.m_gear;
        latestData.rpm = playerData.m_engineRPM;
        latestData.throttle = Math.round(playerData.m_throttle * 100);
        latestData.brake = Math.round(playerData.m_brake * 100);
        latestData.steering = playerData.m_steer;
        latestData.drs = playerData.m_drs;
        latestData.connected = true;
        latestData.timestamp = Date.now();
        
        // Broadcast every 10th update to avoid overwhelming clients
        if (Math.random() < 0.1) {
            broadcastData(latestData);
        }
    }
});

// Motion data (for position)
client.on('motion', (data) => {
    const playerData = data.m_carMotionData[data.m_header.m_playerCarIndex];
    
    if (playerData) {
        latestData.position = {
            x: playerData.m_worldPositionX,
            y: playerData.m_worldPositionY,
            z: playerData.m_worldPositionZ
        };
    }
});

// Participants (for driver name)
client.on('participants', (data) => {
    const playerIndex = data.m_header.m_playerCarIndex;
    const playerData = data.m_participants[playerIndex];
    
    if (playerData && playerData.m_name) {
        latestData.driverName = playerData.m_name;
        console.log(`[Driver] ${latestData.driverName}`);
    }
});

// Error handling
client.on('error', (error) => {
    console.error('[UDP] Error:', error.message);
});

// Start F1 Telemetry Client
client.start();

// Start HTTP/WebSocket Server
server.listen(HTTP_PORT, HOST, () => {
    console.log(`✓ HTTP Server running:    http://${HOST}:${HTTP_PORT}`);
    console.log(`✓ WebSocket Server ready: ws://${HOST}:${HTTP_PORT}`);
    console.log(`✓ UDP Listening on:       ${HOST}:${UDP_PORT}`);
    console.log('');
    console.log('Waiting for F1 25 telemetry data...');
    console.log('');
    console.log('Configure F1 25:');
    console.log(`  - UDP IP Address: <YOUR_VM_PUBLIC_IP>`);
    console.log(`  - UDP Port: ${UDP_PORT}`);
    console.log(`  - UDP Send Rate: 60Hz`);
    console.log('');
});

// Broadcast data every second (even if no new data)
setInterval(() => {
    if (latestData.connected) {
        broadcastData(latestData);
        
        // Check if data is stale (no updates for 5 seconds)
        if (Date.now() - latestData.timestamp > 5000) {
            latestData.connected = false;
            console.log('[Status] No telemetry data received for 5 seconds');
        }
    }
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Shutdown] Closing server...');
    client.stop();
    server.close();
    process.exit(0);
});
