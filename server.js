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
const database = require('./database');

// Backup lap storage file
const LAP_BACKUP_FILE = path.join(__dirname, 'laps_backup.json');

// Load backup laps from file
let backupLaps = [];
(async () => {
    try {
        const data = await fs.promises.readFile(LAP_BACKUP_FILE, 'utf8');
        backupLaps = JSON.parse(data);
        console.log(`[Backup] Loaded ${backupLaps.length} laps from backup file`);
    } catch (err) {
        backupLaps = [];
    }
})();

// Save lap to backup file
async function saveToBackup(lapData) {
    try {
        backupLaps.unshift({
            ...lapData,
            CREATED_AT: new Date().toISOString(),
            LAP_ID: Date.now()
        });
        // Keep only last 500 laps
        if (backupLaps.length > 500) {
            backupLaps = backupLaps.slice(0, 500);
        }
        await fs.promises.writeFile(LAP_BACKUP_FILE, JSON.stringify(backupLaps, null, 2));
        console.log(`[Backup] ✓ Saved lap to backup file (${backupLaps.length} total)`);
    } catch (err) {
        console.error('[Backup] Error saving to backup file:', err.message);
    }
}

// Configuration
const UDP_PORT = process.env.UDP_PORT || 20777;
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Store latest telemetry data
let latestData = {
    connected: false,
    timestamp: null,

    // Session and driver info
    sessionId: null,
    driverName: 'Unknown',
    sessionStartTime: null,

    // Car telemetry
    speed: 0,
    gear: 0,
    rpm: 0,
    maxRpm: 15000,
    throttle: 0,
    brake: 0,
    steering: 0,
    drs: 0,

    // Temperatures
    engineTemp: 0,
    brakeFL: 0,
    brakeFR: 0,
    brakeRL: 0,
    brakeRR: 0,
    tyreFL: 0,
    tyreFR: 0,
    tyreRL: 0,
    tyreRR: 0,

    // G-Force (matching HTML variable names)
    gForceLateral: 0,
    gForceLongitudinal: 0,
    gForceVertical: 0,

    // Lap data
    currentLapTime: 0,
    currentLapTimeStr: '0:00.000',
    lastLapTime: 0,
    lastLapTimeStr: '0:00.000',
    bestLapTime: 0,
    bestLapTimeStr: '0:00.000',

    // Sector times (current lap)
    sector1Time: 0,
    sector1TimeStr: '--:--.---',
    sector2Time: 0,
    sector2TimeStr: '--:--.---',
    sector3Time: 0,
    sector3TimeStr: '--:--.---',

    // Completed lap data (for database)
    completedLapNumber: 0,
    completedSector1: 0,
    completedSector2: 0,
    completedSector3: 0,
    completedLapValid: 1,  // 0 = invalid, 1 = valid

    // Track position
    lapDistance: 0,
    trackLength: 5063, // Singapore track length in meters

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

// Track sector times for the current lap (to save when lap completes)
let currentLapSectors = {
    sector1: 0,
    sector2: 0,
    sector3: 0,
    lapNumber: 0,
    isValid: 1  // 0 = invalid, 1 = valid
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

// Parse F1 25 telemetry packets (OFFICIAL EA SPEC)
function parsePacket(buffer) {
    try {
        if (buffer.length < 29) return; // Minimum header size

        // PacketHeader (29 bytes) - Official EA spec
        const packetFormat = buffer.readUInt16LE(0);      // 2025
        const packetId = buffer.readUInt8(6);             // Packet ID at offset 6
        const playerCarIndex = buffer.readUInt8(28);      // Player car index at offset 28 (last byte of header)

        // Use car 0 if playerCarIndex is invalid (255)
        const carIdx = (playerCarIndex === 255) ? 0 : playerCarIndex;

        // Packet ID 6 = Car Telemetry (1352 bytes)
        if (packetId === 6 && buffer.length === 1352) {
            const carDataSize = 66; // CarTelemetryData size from official spec
            const offset = 29 + (carIdx * carDataSize);

            if (buffer.length >= offset + 60) {
                latestData.speed = buffer.readUInt16LE(offset + 0);
                latestData.throttle = Math.round(buffer.readFloatLE(offset + 2) * 100);
                latestData.steering = buffer.readFloatLE(offset + 6);
                latestData.brake = Math.round(buffer.readFloatLE(offset + 10) * 100);
                latestData.gear = buffer.readInt8(offset + 15);
                latestData.rpm = buffer.readUInt16LE(offset + 16);
                latestData.drs = buffer.readUInt8(offset + 18);
                latestData.maxRpm = 15000;

                // Brake temperatures (4 x uint16)
                latestData.brakeFL = buffer.readUInt16LE(offset + 22);
                latestData.brakeFR = buffer.readUInt16LE(offset + 24);
                latestData.brakeRL = buffer.readUInt16LE(offset + 26);
                latestData.brakeRR = buffer.readUInt16LE(offset + 28);

                // Tyre surface temperatures (4 x uint8)
                latestData.tyreFL = buffer.readUInt8(offset + 30);
                latestData.tyreFR = buffer.readUInt8(offset + 31);
                latestData.tyreRL = buffer.readUInt8(offset + 32);
                latestData.tyreRR = buffer.readUInt8(offset + 33);

                // Engine temperature (uint16)
                latestData.engineTemp = buffer.readUInt16LE(offset + 38);
            }
        }

        // Packet ID 0 = Motion (1349 bytes) - for G-Force
        if (packetId === 0 && buffer.length === 1349) {
            const carMotionSize = 60; // CarMotionData size from official spec
            const offset = 29 + (carIdx * carMotionSize);

            if (buffer.length >= offset + 48) {
                // G-Force values (3 x float) - matching HTML variable names
                latestData.gForceLateral = buffer.readFloatLE(offset + 36);
                latestData.gForceLongitudinal = buffer.readFloatLE(offset + 40);
                latestData.gForceVertical = buffer.readFloatLE(offset + 44);
            }
        }

        // Packet ID 2 = Lap Data (1285 bytes)
        if (packetId === 2 && buffer.length === 1285) {
            const lapDataSize = 58; // LapData size from official spec
            const offset = 29 + (carIdx * lapDataSize);

            if (buffer.length >= offset + 31) {
                const previousLastLapTime = latestData.lastLapTime;

                latestData.lastLapTime = buffer.readUInt32LE(offset + 0);
                latestData.lastLapTimeStr = formatLapTime(latestData.lastLapTime);

                latestData.currentLapTime = buffer.readUInt32LE(offset + 4);
                latestData.currentLapTimeStr = formatLapTime(latestData.currentLapTime);

                // Sector times: MS part + Minutes part (these are for CURRENT lap)
                const sector1MS = buffer.readUInt16LE(offset + 8);
                const sector1Min = buffer.readUInt8(offset + 10);
                const sector1Time = (sector1Min * 60000) + sector1MS;

                const sector2MS = buffer.readUInt16LE(offset + 11);
                const sector2Min = buffer.readUInt8(offset + 13);
                const sector2Time = (sector2Min * 60000) + sector2MS;

                // Lap number and validity
                const currentLapNum = buffer.readUInt8(offset + 33);  // m_currentLapNum at offset 33
                const currentLapInvalid = buffer.readUInt8(offset + 37);  // m_currentLapInvalid at offset 37: 0 = valid, 1 = invalid
                const isLapValid = currentLapInvalid === 0 ? 1 : 0;  // Invert for database (1 = valid)

                // Store current lap sector times (for display and for saving when lap completes)
                latestData.sector1Time = sector1Time;
                latestData.sector1TimeStr = sector1Time > 0 ? formatLapTime(sector1Time) : '--:--.---';
                latestData.sector2Time = sector2Time;
                latestData.sector2TimeStr = sector2Time > 0 ? formatLapTime(sector2Time) : '--:--.---';

                // Calculate sector 3 from current lap
                if (latestData.currentLapTime > 0 && sector1Time > 0 && sector2Time > 0) {
                    latestData.sector3Time = latestData.currentLapTime - sector1Time - sector2Time;
                    latestData.sector3TimeStr = formatLapTime(latestData.sector3Time);
                } else {
                    latestData.sector3Time = 0;
                    latestData.sector3TimeStr = '--:--.---';
                }

                // Store current lap validity
                latestData.currentLapValid = isLapValid;

                // When lap completes (lastLapTime changes), save the sector times from the PREVIOUS lap
                if (latestData.lastLapTime > 0 && latestData.lastLapTime !== previousLastLapTime) {
                    // Use the stored sector times from when the lap was being driven
                    // Calculate sector 3 from completed lap
                    if (currentLapSectors.sector1 > 0 && currentLapSectors.sector2 > 0) {
                        currentLapSectors.sector3 = latestData.lastLapTime - currentLapSectors.sector1 - currentLapSectors.sector2;
                    }

                    // Store completed lap info for database
                    // Use the lap number that was stored BEFORE completion
                    latestData.completedLapNumber = currentLapSectors.lapNumber || Math.max(1, currentLapNum - 1);
                    latestData.completedSector1 = currentLapSectors.sector1;
                    latestData.completedSector2 = currentLapSectors.sector2;
                    latestData.completedSector3 = currentLapSectors.sector3;
                    latestData.completedLapValid = currentLapSectors.isValid;

                    console.log(`[Lap Complete] Lap ${latestData.completedLapNumber}, Time: ${latestData.lastLapTimeStr}, Valid: ${latestData.completedLapValid ? 'YES' : 'NO'}`);

                    // Save to database
                    database.saveLapTime({
                        sessionId: latestData.sessionId,
                        driverName: latestData.driverName,
                        trackName: latestData.trackName,
                        sessionType: latestData.sessionType,
                        lapNumber: latestData.completedLapNumber,
                        lapTimeMs: latestData.lastLapTime,
                        lapTimeFormatted: latestData.lastLapTimeStr,
                        sector1Ms: latestData.completedSector1,
                        sector2Ms: latestData.completedSector2,
                        sector3Ms: latestData.completedSector3,
                        isValid: latestData.completedLapValid
                    }).catch(err => {
                        console.error('[Database] Error saving lap:', err);
                    });
                }

                // Always keep completed lap data available (for display)
                if (latestData.lastLapTime > 0 && latestData.completedLapNumber === 0) {
                    // If we have a last lap time but no completed lap number yet, set it
                    latestData.completedLapNumber = currentLapSectors.lapNumber || Math.max(1, currentLapNum - 1);
                    latestData.completedSector1 = currentLapSectors.sector1;
                    latestData.completedSector2 = currentLapSectors.sector2;
                    latestData.completedSector3 = currentLapSectors.sector3;
                    latestData.completedLapValid = currentLapSectors.isValid;
                }

                // Update current lap sector tracking (for the lap currently being driven)
                currentLapSectors.sector1 = sector1Time;
                currentLapSectors.sector2 = sector2Time;
                currentLapSectors.lapNumber = currentLapNum;
                currentLapSectors.isValid = isLapValid;

                // Lap distance (float at offset 22)
                latestData.lapDistance = buffer.readFloatLE(offset + 22);

                latestData.lapNumber = currentLapNum;
            }
        }

        // Packet ID 1 = Session (753 bytes)
        if (packetId === 1 && buffer.length >= 753) {
            const trackId = buffer.readInt8(36); // Track ID at offset 36 (29 + 7)
            latestData.trackName = TRACK_NAMES[trackId] || `Track ${trackId}`;
            const sessionType = buffer.readUInt8(35);
            const sessionTypes = ['Unknown', 'P1', 'P2', 'P3', 'Short P', 'Q1', 'Q2', 'Q3', 'Short Q', 'OSQ', 'Race', 'Race 2', 'Race 3', 'Time Trial'];
            latestData.sessionType = sessionTypes[sessionType] || 'Unknown';

            // Track length (uint16 at offset 33)
            latestData.trackLength = buffer.readUInt16LE(33);
        }

    } catch (err) {
        console.error('[Parse Error]', err.message);
    }
}

// HTTP Server
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'public', 'index.html');
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
    } else if (req.url === '/api/laps/recent') {
        // Get recent laps from database
        database.getRecentLaps(50).then(laps => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(laps));
        }).catch(err => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch laps' }));
        });
    } else if (req.url.startsWith('/api/laps/session/')) {
        // Get laps by session ID
        const sessionId = req.url.split('/').pop();
        database.getLapsBySession(sessionId).then(laps => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(laps));
        }).catch(err => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch laps' }));
        });
    } else {
        // Serve static files from public folder
        const filePath = path.join(__dirname, 'public', req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }

            // Set correct content type
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html; charset=utf-8',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.css': 'text/css',
                '.js': 'application/javascript'
            };

            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
            res.end(data);
        });
    }
});

// WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    ws.send(JSON.stringify(latestData));

    // Handle messages from client (driver name, session name, session ID)
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'setDriver') {
                latestData.driverName = data.driverName || 'Unknown';
                latestData.sessionType = data.sessionName || 'Unknown';  // Store session name as sessionType
                latestData.sessionId = data.sessionId;
                if (!latestData.sessionStartTime) {
                    latestData.sessionStartTime = new Date().toISOString();
                }
                console.log(`[Session] Driver: ${latestData.driverName}, Session: ${latestData.sessionType}, ID: ${latestData.sessionId}`);
            }
        } catch (err) {
            console.error('[WebSocket] Error parsing message:', err);
        }
    });
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

udpServer.on('message', (msg, rinfo) => {
    latestData.packetsReceived++;
    latestData.connected = true;
    latestData.timestamp = Date.now();

    // Parse the packet
    parsePacket(msg);
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

// Initialize database
database.initialize().then(success => {
    if (success) {
        console.log('[Server] Database integration enabled');
    } else {
        console.log('[Server] Running in preview mode (no database)');
    }
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

process.on('SIGINT', async () => {
    console.log('\n[Shutdown]');
    await database.close();
    udpServer.close();
    server.close();
    process.exit(0);
});

