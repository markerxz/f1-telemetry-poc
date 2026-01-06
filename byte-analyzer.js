#!/usr/bin/env node

/**
 * Byte-by-byte analyzer - Try reading telemetry data as different types
 */

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

let telemetrySample = null;

client.on('listening', () => {
    console.log('\n🔍 BYTE ANALYZER - Listening on 0.0.0.0:20777\n');
    console.log('Drive in F1 25, then press Ctrl+C\n');
});

client.on('message', (msg, rinfo) => {
    if (msg.length < 29) return;
    
    const packetId = msg.readUInt8(6);
    
    // Capture Telemetry packet (ID 0, size 1349)
    if (packetId === 0 && msg.length === 1349 && !telemetrySample) {
        telemetrySample = msg;
        console.log('✓ Captured Telemetry packet! Press Ctrl+C\n');
    }
});

client.on('error', (err) => {
    console.error(`\n❌ Error: ${err}`);
    process.exit(1);
});

client.bind(20777, '0.0.0.0');

process.on('SIGINT', () => {
    if (!telemetrySample) {
        console.log('\nNo telemetry packet captured!');
        process.exit(1);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TELEMETRY PACKET - BYTE-BY-BYTE ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Trying to read first car data starting at offset 29:\n');
    
    const startOffset = 29;
    
    // Try reading first 20 bytes as different types
    for (let i = 0; i < 40; i++) {
        const offset = startOffset + i;
        
        if (offset + 4 > telemetrySample.length) break;
        
        const u8 = telemetrySample.readUInt8(offset);
        const i8 = telemetrySample.readInt8(offset);
        
        let u16le = 'N/A', i16le = 'N/A', f32le = 'N/A';
        
        if (offset + 2 <= telemetrySample.length) {
            u16le = telemetrySample.readUInt16LE(offset);
            i16le = telemetrySample.readInt16LE(offset);
        }
        
        if (offset + 4 <= telemetrySample.length) {
            f32le = telemetrySample.readFloatLE(offset).toFixed(3);
        }
        
        const hex = telemetrySample.slice(offset, offset + 4).toString('hex');
        
        console.log(`Offset ${offset.toString().padStart(3)}: [${hex.padEnd(11)}] u8=${u8.toString().padStart(3)} i8=${i8.toString().padStart(4)} u16=${u16le.toString().padStart(5)} i16=${i16le.toString().padStart(6)} f32=${f32le.padStart(12)}`);
        
        // Highlight potential speed values (0-400)
        if (typeof u16le === 'number' && u16le > 0 && u16le < 400) {
            console.log(`         ^^^ Could be SPEED: ${u16le} km/h`);
        }
        
        // Highlight potential throttle/brake values (0.0-1.0)
        if (typeof f32le === 'string') {
            const f = parseFloat(f32le);
            if (f >= 0 && f <= 1) {
                console.log(`         ^^^ Could be THROTTLE/BRAKE/STEERING: ${(f * 100).toFixed(1)}%`);
            }
        }
        
        // Highlight potential gear values (-1 to 8)
        if (i8 >= -1 && i8 <= 8) {
            console.log(`         ^^^ Could be GEAR: ${i8}`);
        }
        
        // Highlight potential RPM values (0-20000)
        if (typeof u16le === 'number' && u16le > 1000 && u16le < 20000) {
            console.log(`         ^^^ Could be RPM: ${u16le}`);
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
    client.close();
    process.exit(0);
});

