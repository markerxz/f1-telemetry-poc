#!/usr/bin/env node

/**
 * F1 25 CLI Inspector - Decodes and displays telemetry in SSH terminal
 * Shows: Track, Speed, Throttle, Brake, Steering, Lap Times, etc.
 */

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

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

// Format lap time
function formatLapTime(ms) {
    if (!ms || ms === 0) return '0:00.000';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

let packetCount = 0;
let playerCarIndex = 0;

client.on('listening', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   🏎️  F1 CLI Inspector listening on 0.0.0.0:20777    ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Waiting for F1 25 data...');
    console.log('');
});

client.on('message', (msg, rinfo) => {
    packetCount++;
    
    try {
        if (msg.length < 29) return;
        
        // F1 2025 Header - Packet ID is at offset 6
        const packetFormat = msg.readUInt16LE(0);
        const packetVersion = msg.readUInt8(4);
        const packetId = msg.readUInt8(6); // CORRECT offset for F1 2025
        playerCarIndex = msg.readUInt8(22);
        
        // Packet ID 1 = Session Data
        if (packetId === 1 && msg.length >= 632) {
            const trackId = msg.readInt8(29);
            const trackName = TRACK_NAMES[trackId] || `Track ${trackId}`;
            const sessionType = msg.readUInt8(30);
            const sessionTypes = ['Unknown', 'P1', 'P2', 'P3', 'Short P', 'Q1', 'Q2', 'Q3', 'Short Q', 'OSQ', 'Race', 'Race 2', 'Race 3', 'Time Trial'];
            const sessionName = sessionTypes[sessionType] || 'Unknown';
            
            console.log(`\n📍 SESSION | Track: ${trackName} | Type: ${sessionName} | Format: ${packetFormat} | Player: ${playerCarIndex}`);
        }
        
        // Packet ID 6 = Car Telemetry
        if (packetId === 6) {
            const baseOffset = 30;
            const carDataSize = 66;
            const offset = baseOffset + (playerCarIndex * carDataSize);
            
            if (msg.length >= offset + carDataSize) {
                const speed = msg.readUInt16LE(offset + 0);
                const throttle = Math.round(msg.readFloatLE(offset + 2) * 100);
                const steering = msg.readFloatLE(offset + 6).toFixed(2);
                const brake = Math.round(msg.readFloatLE(offset + 10) * 100);
                const gear = msg.readInt8(offset + 15);
                const rpm = msg.readUInt16LE(offset + 16);
                const drs = msg.readUInt8(offset + 18);
                
                console.log(`🚗 TELEMETRY | Speed: ${speed} km/h | Throttle: ${throttle}% | Brake: ${brake}% | Steering: ${steering} | Gear: ${gear} | RPM: ${rpm} | DRS: ${drs}`);
            }
        }
        
        // Packet ID 2 = Lap Data
        if (packetId === 2) {
            const baseOffset = 30;
            const lapDataSize = 56;
            const offset = baseOffset + (playerCarIndex * lapDataSize);
            
            if (msg.length >= offset + lapDataSize) {
                const lastLapTime = msg.readUInt32LE(offset + 0);
                const currentLapTime = msg.readUInt32LE(offset + 4);
                const sector1Time = msg.readUInt16LE(offset + 8);
                const sector2Time = msg.readUInt16LE(offset + 12);
                const lapNumber = msg.readUInt8(offset + 22);
                
                console.log(`⏱️  LAP DATA | Lap: ${lapNumber} | Current: ${formatLapTime(currentLapTime)} | Last: ${formatLapTime(lastLapTime)} | S1: ${formatLapTime(sector1Time)} | S2: ${formatLapTime(sector2Time)}`);
            }
        }
        
        // Packet ID 0 = Motion Data
        if (packetId === 0) {
            const baseOffset = 30;
            const motionDataSize = 60;
            const offset = baseOffset + (playerCarIndex * motionDataSize);
            
            if (msg.length >= offset + 24) {
                const posX = msg.readFloatLE(offset + 0).toFixed(1);
                const posY = msg.readFloatLE(offset + 4).toFixed(1);
                const posZ = msg.readFloatLE(offset + 8).toFixed(1);
                const velX = msg.readFloatLE(offset + 12).toFixed(1);
                const velY = msg.readFloatLE(offset + 16).toFixed(1);
                const velZ = msg.readFloatLE(offset + 20).toFixed(1);
                
                console.log(`📐 MOTION | Pos: (${posX}, ${posY}, ${posZ}) | Vel: (${velX}, ${velY}, ${velZ})`);
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
