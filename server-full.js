#!/usr/bin/env node

/**
 * F1 25 Telemetry Server - FULL VERSION with Real Parsing
 * 
 * Now that we know packets are received, let's parse them!
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

// Store latest telemetry data
let latestData = {
    connected: false,
    timestamp: null,
    
    // Car telemetry
    speed: 0,
    gear: 0,
    rpm: 0,
    maxRpm: 15000,
    throttle: 0,
    brake: 0,
    steering: 0,
    drs: 0,
    
    // Lap data
    currentLapTime: 0,
    currentLapTimeStr: '0:00.000',
    lastLapTime: 0,
    lastLapTimeStr: '0:00.000',
    bestLapTime: 0,
    bestLapTimeStr: '0:00.000',
    
    // Sector times
    sector1Time: 0,
    sector1TimeStr: '--:--.---',
    sector2Time: 0,
    sector2TimeStr: '--:--.---',
    sector3Time: 0,
    sector3TimeStr: '--:--.---',
    
    // Session info
    trackName: 'Unknown',
    sessionType: 'Unknown',
    lapNumber: 0,
    
    // Stats
    packetsReceived: 0
};

// Best lap tracking (for Singapore GP)
let singaporeBestLap = {
    lapTime: Infinity,
    sector1: Infinity,
    sector2: Infinity,
    sector3: Infinity,
    timestamp: null
};

// Track names
const TRACK_NAMES = {
    0: 'Melbourne', 1: 'Paul Ricard', 2: 'Shanghai', 3: 'Bahrain', 4: 'Barcelona',
    5: 'Monaco', 6: 'Montreal', 7: 'Silverstone', 8: 'Hockenheim', 9: 'Hungaroring',
    10: 'Spa', 11: 'Monza', 12: 'Singapore', 13: 'Suzuka', 14: 'Abu Dhabi',
    15: 'Texas', 16: 'Brazil', 17: 'Austria', 18: 'Sochi', 19: 'Mexico',
    20: 'Baku', 21: 'Bahrain Short', 22: 'Silverstone Short', 23: 'Texas Short',
    24: 'Suzuka Short', 25: 'Hanoi', 26: 'Zandvoort', 27: 'Imola', 28: 'Portimao',
    29: 'Jeddah', 30: 'Miami', 31: 'Las Vegas', 32: 'Losail'
};

// Format milliseconds to lap time
function formatLapTime(ms) {
    if (!ms || ms === 0) return '0:00.000';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Parse F1 25 telemetry packets (2024 format)
function parsePacket(buffer) {
    try {
        if (buffer.length < 29) return; // Minimum header size for F1 2024
        
        // F1 2025 Packet Header (Experimental Adjustment)
        // Packet ID seems to be at offset 6 based on logs
        const packetFormat = buffer.readUInt16LE(0);
        const packetVersion = buffer.readUInt8(4);
        const packetId = buffer.readUInt8(6); // CHANGED from 5 to 6
        const playerCarIndex = buffer.readUInt8(22); // Shifted +1 (was 21)
        
        // Packet ID 6 = Car Telemetry
        if (packetId === 6) {
            // Header is likely 30 bytes now (29+1) or just shifted
            const baseOffset = 30; // Shifted +1
            const carDataSize = 66; // Assuming same size
            const offset = baseOffset + (playerCarIndex * carDataSize);
            
            if (buffer.length >= offset + carDataSize) {
                latestData.speed = buffer.readUInt16LE(offset + 0);
                latestData.throttle = Math.round(buffer.readFloatLE(offset + 2) * 100);
                latestData.steering = buffer.readFloatLE(offset + 6);
                latestData.brake = Math.round(buffer.readFloatLE(offset + 10) * 100);
                latestData.gear = buffer.readInt8(offset + 15);
                latestData.rpm = buffer.readUInt16LE(offset + 16);
                latestData.drs = buffer.readUInt8(offset + 18);
                latestData.maxRpm = 15000;
            }
        }
        
        // Packet ID 2 = Lap Data  
        if (packetId === 2) {
            const baseOffset = 30; // Shifted +1
            const lapDataSize = 56;
            const offset = baseOffset + (playerCarIndex * lapDataSize);
            
            if (buffer.length >= offset + lapDataSize) {
                latestData.lastLapTime = buffer.readUInt32LE(offset + 0);
                latestData.lastLapTimeStr = formatLapTime(latestData.lastLapTime);
                
                latestData.currentLapTime = buffer.readUInt32LE(offset + 4);
                latestData.currentLapTimeStr = formatLapTime(latestData.currentLapTime);
                
                latestData.sector1Time = buffer.readUInt16LE(offset + 8);
                latestData.sector1TimeStr = latestData.sector1Time > 0 ? formatLapTime(latestData.sector1Time) : '--:--.---';
                
                latestData.sector2Time = buffer.readUInt16LE(offset + 12);
                latestData.sector2TimeStr = latestData.sector2Time > 0 ? formatLapTime(latestData.sector2Time) : '--:--.---';
                
                if (latestData.lastLapTime > 0 && latestData.sector1Time > 0 && latestData.sector2Time > 0) {
                    const sector3Time = latestData.lastLapTime - latestData.sector1Time - latestData.sector2Time;
                    if (sector3Time > 0) latestData.sector3Time = sector3Time;
                }
                
                latestData.lapNumber = buffer.readUInt8(offset + 22);
            }
        }
        
        // Packet ID 1 = Session
        if (packetId === 1) {
            // Session packet: header (29 bytes) + session data
            if (buffer.length >= 632) {
                const trackId = buffer.readInt8(29); // Track ID is first byte after header
                latestData.trackName = TRACK_NAMES[trackId] || `Track ${trackId}`;
                const sessionType = buffer.readUInt8(30);
                const sessionTypes = ['Unknown', 'P1', 'P2', 'P3', 'Short P', 'Q1', 'Q2', 'Q3', 'Short Q', 'OSQ', 'Race', 'Race 2', 'Race 3', 'Time Trial'];
                latestData.sessionType = sessionTypes[sessionType] || 'Unknown';
            }
        }
        
    } catch (err) {
        console.error('[Parse Error]', err.message);
    }
}

// HTTP Server
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'public', 'index-full.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Dashboard not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(data);
            }
        });
    } else if (req.url === '/api/data') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(latestData));
    } else if (req.url === '/api/singapore-best') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            lapTime: formatLapTime(singaporeBestLap.lapTime === Infinity ? 0 : singaporeBestLap.lapTime),
            sector1: formatLapTime(singaporeBestLap.sector1 === Infinity ? 0 : singaporeBestLap.sector1),
            sector2: formatLapTime(singaporeBestLap.sector2 === Infinity ? 0 : singaporeBestLap.sector2),
            sector3: formatLapTime(singaporeBestLap.sector3 === Infinity ? 0 : singaporeBestLap.sector3),
            timestamp: singaporeBestLap.timestamp
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// WebSocket
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

// UDP Server
const udpServer = dgram.createSocket('udp4');

let hexdumpCounter = 0;

udpServer.on('message', (msg, rinfo) => {
    latestData.packetsReceived++;
    latestData.connected = true;
    latestData.timestamp = Date.now();
    
    // Temporary debug: log first few packets as hex
    if (hexdumpCounter < 5) {
        console.log(`[HEX DUMP ${hexdumpCounter + 1}] Packet ID: ${msg.readUInt8(6)} | Size: ${msg.length}`);
        console.log(msg.slice(0, 64).toString('hex').match(/.{1,32}/g).join('\n'));
        hexdumpCounter++;
    }
    
    // Parse the packet
    parsePacket(msg);
    
    // Debug: Log packet type distribution
    const packetId = msg.length >= 7 ? msg.readUInt8(6) : -1;
    if (packetId !== 1 && packetId !== -1 && latestData.packetsReceived % 20 === 0) {
        const packetTypes = ['Motion', 'Session', 'Lap', 'Event', 'Participants', 'Car Setup', 'Telemetry', 'Car Status', 'Final Classification', 'Lobby Info', 'Car Damage', 'Session History', 'Tyre Sets', 'Motion Ex'];
        const packetName = packetTypes[packetId] || `Unknown(${packetId})`;
        console.log(`[UDP] Packet ${packetName} (ID:${packetId}) received | Size: ${msg.length}`);
    }
});

udpServer.on('listening', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   F1 25 Telemetry Server - FULL PARSING               ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✓ Dashboard:  http://${HOST}:${HTTP_PORT}`);
    console.log(`✓ UDP Server: ${HOST}:${UDP_PORT}`);
    console.log('');
    console.log('Waiting for F1 25 telemetry...');
    console.log('');
});

udpServer.bind(UDP_PORT, HOST);
server.listen(HTTP_PORT, HOST);

// Broadcast every 100ms for smooth updates
setInterval(() => {
    if (latestData.connected) {
        broadcastData();
        if (Date.now() - latestData.timestamp > 5000) {
            latestData.connected = false;
        }
    }
}, 100);

process.on('SIGINT', () => {
    console.log('\n[Shutdown]');
    udpServer.close();
    server.close();
    process.exit(0);
});

