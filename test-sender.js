#!/usr/bin/env node

/**
 * F1 Telemetry Mock Sender
 * 
 * Sends fake F1 25 telemetry packets to test your VM
 * Run this on your local PC to simulate F1 25 game
 */

const dgram = require('dgram');

// Configuration
const VM_IP = process.argv[2] || '140.245.116.86';
const UDP_PORT = 20777;
const SEND_RATE = 60; // Hz (packets per second)

const client = dgram.createSocket('udp4');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     F1 Telemetry Mock Sender - Test Tool              ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Target VM:  ${VM_IP}:${UDP_PORT}`);
console.log(`Send Rate:  ${SEND_RATE} packets/second`);
console.log('');
console.log('Simulating F1 25 telemetry...');
console.log('Press Ctrl+C to stop');
console.log('');

// F1 25 Packet Header Structure (simplified)
function createF1PacketHeader(packetId) {
    const buffer = Buffer.alloc(29);
    let offset = 0;
    
    // Packet format (uint16)
    buffer.writeUInt16LE(2024, offset); offset += 2;
    
    // Game year (uint8)
    buffer.writeUInt8(25, offset); offset += 1;
    
    // Game major version (uint8)
    buffer.writeUInt8(1, offset); offset += 1;
    
    // Game minor version (uint8)
    buffer.writeUInt8(0, offset); offset += 1;
    
    // Packet version (uint8)
    buffer.writeUInt8(1, offset); offset += 1;
    
    // Packet ID (uint8)
    buffer.writeUInt8(packetId, offset); offset += 1;
    
    // Session UID (uint64)
    buffer.writeBigUInt64LE(BigInt(12345678), offset); offset += 8;
    
    // Session time (float)
    buffer.writeFloatLE(123.456, offset); offset += 4;
    
    // Frame identifier (uint32)
    buffer.writeUInt32LE(Math.floor(Date.now() / 1000), offset); offset += 4;
    
    // Overall frame identifier (uint32)
    buffer.writeUInt32LE(Math.floor(Date.now() / 1000), offset); offset += 4;
    
    // Player car index (uint8)
    buffer.writeUInt8(0, offset); offset += 1;
    
    // Secondary player car index (uint8)
    buffer.writeUInt8(255, offset); offset += 1;
    
    return buffer;
}

// Create mock telemetry packet
function createMockTelemetryPacket() {
    const header = createF1PacketHeader(6); // Packet ID 6 = Car Telemetry
    
    // Simulate car data (simplified)
    const carDataSize = 100; // Approximate size of car telemetry data
    const carData = Buffer.alloc(carDataSize);
    
    // Fill with some realistic-looking data
    let offset = 0;
    
    // Speed (uint16) - 0-400 km/h
    const speed = Math.floor(150 + Math.random() * 100);
    carData.writeUInt16LE(speed, offset); offset += 2;
    
    // Throttle (float) - 0.0 to 1.0
    carData.writeFloatLE(0.8 + Math.random() * 0.2, offset); offset += 4;
    
    // Steer (float) - -1.0 to 1.0
    carData.writeFloatLE((Math.random() - 0.5) * 0.3, offset); offset += 4;
    
    // Brake (float) - 0.0 to 1.0
    carData.writeFloatLE(Math.random() * 0.2, offset); offset += 4;
    
    // Gear (uint8) - 1-8
    carData.writeUInt8(Math.floor(4 + Math.random() * 3), offset); offset += 1;
    
    // Engine RPM (uint16) - 0-15000
    carData.writeUInt16LE(Math.floor(10000 + Math.random() * 3000), offset); offset += 2;
    
    // DRS (uint8) - 0 or 1
    carData.writeUInt8(Math.random() > 0.8 ? 1 : 0, offset); offset += 1;
    
    // Combine header and data
    return Buffer.concat([header, carData]);
}

// Create mock lap data packet
function createMockLapDataPacket() {
    const header = createF1PacketHeader(2); // Packet ID 2 = Lap Data
    
    const lapData = Buffer.alloc(150);
    let offset = 0;
    
    // Last lap time (uint32) - milliseconds
    lapData.writeUInt32LE(92345, offset); offset += 4; // 1:32.345
    
    // Current lap time (uint32)
    const currentLapTime = 10000 + Math.floor(Math.random() * 80000);
    lapData.writeUInt32LE(currentLapTime, offset); offset += 4;
    
    // Sector 1 time (uint16)
    lapData.writeUInt16LE(28500, offset); offset += 2;
    
    // Sector 2 time (uint16)
    lapData.writeUInt16LE(32800, offset); offset += 2;
    
    // Distance (float)
    lapData.writeFloatLE(1234.5, offset); offset += 4;
    
    // Lap number (uint8)
    lapData.writeUInt8(5, offset); offset += 1;
    
    return Buffer.concat([header, lapData]);
}

// Create mock session packet
function createMockSessionPacket() {
    const header = createF1PacketHeader(1); // Packet ID 1 = Session
    
    const sessionData = Buffer.alloc(200);
    let offset = 0;
    
    // Track ID (uint8) - 12 = Singapore
    sessionData.writeUInt8(12, offset); offset += 1;
    
    // Session type (uint8) - 13 = Time Trial
    sessionData.writeUInt8(13, offset); offset += 1;
    
    return Buffer.concat([header, sessionData]);
}

// Send packets
let packetCount = 0;
let packetTypes = ['telemetry', 'lap', 'session'];
let currentPacketIndex = 0;

const interval = setInterval(() => {
    let packet;
    
    // Rotate through packet types
    switch(packetTypes[currentPacketIndex]) {
        case 'telemetry':
            packet = createMockTelemetryPacket();
            break;
        case 'lap':
            packet = createMockLapDataPacket();
            break;
        case 'session':
            packet = createMockSessionPacket();
            break;
    }
    
    currentPacketIndex = (currentPacketIndex + 1) % packetTypes.length;
    
    // Send packet
    client.send(packet, UDP_PORT, VM_IP, (err) => {
        if (err) {
            console.error(`[ERROR] Failed to send packet: ${err.message}`);
        } else {
            packetCount++;
            if (packetCount % SEND_RATE === 0) {
                console.log(`[${new Date().toLocaleTimeString()}] Sent ${packetCount} packets (${packet.length} bytes each)`);
            }
        }
    });
    
}, 1000 / SEND_RATE);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     Stopping Mock Sender                               ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Total packets sent: ${packetCount}`);
    console.log('');
    clearInterval(interval);
    client.close();
    process.exit(0);
});

// Handle errors
client.on('error', (err) => {
    console.error(`[ERROR] ${err.message}`);
    client.close();
});

console.log('[READY] Sending mock telemetry packets...');
console.log('');

