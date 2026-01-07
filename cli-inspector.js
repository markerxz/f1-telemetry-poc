#!/usr/bin/env node

/**
 * F1 25 CLI Inspector - CORRECT implementation using official EA spec
 */

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

// Track names (official spec)
const TRACK_NAMES = {
    0: 'Melbourne', 1: 'Paul Ricard', 2: 'Shanghai', 3: 'Bahrain', 4: 'Barcelona',
    5: 'Monaco', 6: 'Montreal', 7: 'Silverstone', 8: 'Hockenheim', 9: 'Hungaroring',
    10: 'Spa', 11: 'Monza', 12: 'Singapore', 13: 'Suzuka', 14: 'Abu Dhabi',
    15: 'Texas', 16: 'Brazil', 17: 'Austria', 18: 'Sochi', 19: 'Mexico',
    20: 'Baku', 21: 'Bahrain Short', 22: 'Silverstone Short', 23: 'Texas Short',
    24: 'Suzuka Short', 25: 'Hanoi', 26: 'Zandvoort', 27: 'Imola', 28: 'Portimao',
    29: 'Jeddah', 30: 'Miami', 31: 'Las Vegas', 32: 'Losail'
};

// Format lap time
function formatLapTime(ms) {
    if (!ms || ms === 0) return '0:00.000';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

let packetCount = 0;

client.on('listening', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   🏎️  F1 25 CLI Inspector (OFFICIAL SPEC)            ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Listening on 0.0.0.0:20777');
    console.log('Waiting for F1 25 data...');
    console.log('');
});

client.on('message', (msg, rinfo) => {
    packetCount++;
    
    try {
        if (msg.length < 29) return;
        
        // PacketHeader (29 bytes) - Official EA spec
        const packetFormat = msg.readUInt16LE(0);      // 2025
        const gameYear = msg.readUInt8(2);             // 25
        const gameMajorVersion = msg.readUInt8(3);     // Game major version
        const gameMinorVersion = msg.readUInt8(4);     // Game minor version
        const packetVersion = msg.readUInt8(5);        // Packet version
        const packetId = msg.readUInt8(6);             // Packet ID
        const playerCarIndex = msg.readUInt8(28);      // Player car index (last byte of header)
        
        // Use car 0 if playerCarIndex is invalid (255)
        const carIdx = (playerCarIndex === 255) ? 0 : playerCarIndex;
        
        // Packet ID 1 = Session Data (753 bytes)
        if (packetId === 1 && msg.length >= 753) {
            // Session data starts at offset 29
            const weather = msg.readUInt8(29);
            const trackTemperature = msg.readInt8(30);
            const airTemperature = msg.readInt8(31);
            const totalLaps = msg.readUInt8(32);
            const trackLength = msg.readUInt16LE(33);
            const sessionType = msg.readUInt8(35);
            const trackId = msg.readInt8(36);  // Track ID at offset 36!
            
            const trackName = TRACK_NAMES[trackId] || `Track ${trackId}`;
            const sessionTypes = ['Unknown', 'P1', 'P2', 'P3', 'Short P', 'Q1', 'Q2', 'Q3', 'Short Q', 'OSQ', 'Race', 'Race 2', 'Race 3', 'Time Trial'];
            const sessionName = sessionTypes[sessionType] || 'Unknown';
            
            console.log(`\n📍 SESSION | Track: ${trackName} | Type: ${sessionName} | Laps: ${totalLaps} | Temp: ${trackTemperature}°C`);
        }
        
        // Packet ID 6 = Car Telemetry (1352 bytes)
        if (packetId === 6 && msg.length === 1352) {
            const carDataSize = 66; // CarTelemetryData size from spec
            const offset = 29 + (carIdx * carDataSize);
            
            if (msg.length >= offset + 19) {
                // CarTelemetryData structure (official spec)
                const speed = msg.readUInt16LE(offset + 0);
                const throttle = msg.readFloatLE(offset + 2);
                const steer = msg.readFloatLE(offset + 6);
                const brake = msg.readFloatLE(offset + 10);
                const clutch = msg.readUInt8(offset + 14);
                const gear = msg.readInt8(offset + 15);
                const rpm = msg.readUInt16LE(offset + 16);
                const drs = msg.readUInt8(offset + 18);
                
                console.log(`🚗 TELEMETRY | Speed: ${speed} km/h | Throttle: ${(throttle * 100).toFixed(0)}% | Brake: ${(brake * 100).toFixed(0)}% | Steering: ${steer.toFixed(2)} | Gear: ${gear} | RPM: ${rpm} | DRS: ${drs}`);
            }
        }
        
        // Packet ID 2 = Lap Data (1285 bytes)
        if (packetId === 2 && msg.length === 1285) {
            const lapDataSize = 58; // LapData size from spec
            const offset = 29 + (carIdx * lapDataSize);
            
            if (msg.length >= offset + 30) {
                // LapData structure (official spec)
                const lastLapTime = msg.readUInt32LE(offset + 0);
                const currentLapTime = msg.readUInt32LE(offset + 4);
                const sector1MS = msg.readUInt16LE(offset + 8);
                const sector1Min = msg.readUInt8(offset + 10);
                const sector2MS = msg.readUInt16LE(offset + 11);
                const sector2Min = msg.readUInt8(offset + 13);
                const lapDistance = msg.readFloatLE(offset + 22);
                const currentLapNum = msg.readUInt8(offset + 30);
                
                const sector1Total = (sector1Min * 60000) + sector1MS;
                const sector2Total = (sector2Min * 60000) + sector2MS;
                
                console.log(`⏱️  LAP DATA | Lap: ${currentLapNum} | Current: ${formatLapTime(currentLapTime)} | Last: ${formatLapTime(lastLapTime)} | S1: ${formatLapTime(sector1Total)} | S2: ${formatLapTime(sector2Total)} | Dist: ${lapDistance.toFixed(0)}m`);
            }
        }
        
        // Packet ID 0 = Motion (1349 bytes)
        if (packetId === 0 && msg.length === 1349) {
            const carMotionSize = 60; // CarMotionData size from spec
            const offset = 29 + (carIdx * carMotionSize);
            
            if (msg.length >= offset + 24) {
                const posX = msg.readFloatLE(offset + 0);
                const posY = msg.readFloatLE(offset + 4);
                const posZ = msg.readFloatLE(offset + 8);
                const velX = msg.readFloatLE(offset + 12);
                const velY = msg.readFloatLE(offset + 16);
                const velZ = msg.readFloatLE(offset + 20);
                
                console.log(`📐 MOTION | Pos: (${posX.toFixed(1)}, ${posY.toFixed(1)}, ${posZ.toFixed(1)}) | Vel: (${velX.toFixed(1)}, ${velY.toFixed(1)}, ${velZ.toFixed(1)})`);
            }
        }
        
        // Show packet count every 100 packets
        if (packetCount % 100 === 0) {
            console.log(`\n✅ Total packets received: ${packetCount}\n`);
        }
        
    } catch (err) {
        console.error(`❌ Parse error: ${err.message}`);
    }
});

client.on('error', (err) => {
    console.error(`\n❌ Server error: ${err}`);
    process.exit(1);
});

client.bind(20777, '0.0.0.0');

process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...\n');
    client.close();
    process.exit(0);
});

