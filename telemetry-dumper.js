#!/usr/bin/env node

/**
 * Telemetry Data Dumper - Shows raw data from Telemetry and Lap packets
 */

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

let telemetrySample = null;
let lapDataSample = null;
let count = 0;

client.on('listening', () => {
    console.log('\n🔍 TELEMETRY DUMPER - Listening on 0.0.0.0:20777\n');
    console.log('Drive in F1 25 (throttle, brake, steer), then press Ctrl+C\n');
});

client.on('message', (msg, rinfo) => {
    count++;
    
    if (msg.length < 29) return;
    
    const packetId = msg.readUInt8(6);
    const playerCarIndex = msg.readUInt8(28);
    
    // Capture Telemetry packet (ID 0, size 1349)
    if (packetId === 0 && msg.length === 1349 && !telemetrySample) {
        telemetrySample = { buffer: msg, playerCarIndex: playerCarIndex };
        console.log('✓ Captured Telemetry packet (ID 0)');
    }
    
    // Capture Lap Data packet (ID 15, size 1131)
    if (packetId === 15 && msg.length === 1131 && !lapDataSample) {
        lapDataSample = { buffer: msg, playerCarIndex: playerCarIndex };
        console.log('✓ Captured Lap Data packet (ID 15)');
    }
    
    if (telemetrySample && lapDataSample) {
        console.log('\n✓ Got both packets! Press Ctrl+C to analyze\n');
    }
    
    if (count % 100 === 0) {
        process.stdout.write(`\rPackets: ${count}`);
    }
});

client.on('error', (err) => {
    console.error(`\n❌ Error: ${err}`);
    process.exit(1);
});

client.bind(20777, '0.0.0.0');

process.on('SIGINT', () => {
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('TELEMETRY PACKET (ID 0, Size 1349)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (telemetrySample) {
        const msg = telemetrySample.buffer;
        const playerIdx = telemetrySample.playerCarIndex;
        
        console.log(`Player Car Index: ${playerIdx}`);
        console.log('\nHeader (bytes 0-28):');
        console.log(msg.slice(0, 29).toString('hex').match(/../g).join(' '));
        
        console.log('\n\nTrying different car data sizes and offsets:');
        console.log('(Looking for realistic values: Speed 0-400, Throttle 0-1, RPM 0-20000)\n');
        
        const carDataSizes = [60, 62, 64, 66, 68, 70];
        
        carDataSizes.forEach(carDataSize => {
            // If playerIdx is 255 (spectator/invalid), use car 0
            const carIdx = playerIdx === 255 ? 0 : playerIdx;
            const offset = 29 + (carIdx * carDataSize);
            
            if (msg.length >= offset + 20) {
                console.log(`\n--- Car Data Size: ${carDataSize} bytes, Offset: ${offset} ---`);
                
                // Try reading as different data types
                const speedU16 = msg.readUInt16LE(offset + 0);
                const throttleF32 = msg.readFloatLE(offset + 2);
                const steerF32 = msg.readFloatLE(offset + 6);
                const brakeF32 = msg.readFloatLE(offset + 10);
                const gear = msg.readInt8(offset + 14);
                const rpmU16_1 = msg.readUInt16LE(offset + 15);
                const rpmU16_2 = msg.readUInt16LE(offset + 16);
                
                console.log(`  Speed (u16 @ +0):     ${speedU16} km/h`);
                console.log(`  Throttle (f32 @ +2):  ${throttleF32.toFixed(3)} (${(throttleF32 * 100).toFixed(1)}%)`);
                console.log(`  Steering (f32 @ +6):  ${steerF32.toFixed(3)}`);
                console.log(`  Brake (f32 @ +10):    ${brakeF32.toFixed(3)} (${(brakeF32 * 100).toFixed(1)}%)`);
                console.log(`  Gear (i8 @ +14):      ${gear}`);
                console.log(`  RPM (u16 @ +15):      ${rpmU16_1}`);
                console.log(`  RPM (u16 @ +16):      ${rpmU16_2}`);
                
                // Check if values are realistic
                const realistic = speedU16 < 400 && 
                                throttleF32 >= 0 && throttleF32 <= 1 && 
                                brakeF32 >= 0 && brakeF32 <= 1 &&
                                gear >= -1 && gear <= 8 &&
                                (rpmU16_1 < 20000 || rpmU16_2 < 20000);
                
                if (realistic) {
                    console.log('  ✓ VALUES LOOK REALISTIC!');
                }
            }
        });
        
        console.log('\n\nFirst 128 bytes after header (car data for all cars):');
        const dataStart = 29;
        const hex = msg.slice(dataStart, dataStart + 128).toString('hex').match(/../g);
        if (hex) {
            for (let i = 0; i < 128 && hex[i]; i += 16) {
                const line = hex.slice(i, i + 16).join(' ');
                const off = i.toString().padStart(3, '0');
                console.log(`  ${off}: ${line}`);
            }
        }
    } else {
        console.log('No telemetry packet captured!');
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('LAP DATA PACKET (ID 15, Size 1131)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (lapDataSample) {
        const msg = lapDataSample.buffer;
        const playerIdx = lapDataSample.playerCarIndex;
        
        console.log(`Player Car Index: ${playerIdx}`);
        
        console.log('\n\nTrying different lap data sizes:');
        const lapDataSizes = [50, 52, 54, 55, 56, 58, 60];
        
        lapDataSizes.forEach(lapDataSize => {
            // If playerIdx is 255 (spectator/invalid), use car 0
            const carIdx = playerIdx === 255 ? 0 : playerIdx;
            const offset = 29 + (carIdx * lapDataSize);
            
            if (msg.length >= offset + 24) {
                console.log(`\n--- Lap Data Size: ${lapDataSize} bytes, Offset: ${offset} ---`);
                
                const lastLapTime = msg.readUInt32LE(offset + 0);
                const currentLapTime = msg.readUInt32LE(offset + 4);
                const sector1 = msg.readUInt16LE(offset + 8);
                const sector2 = msg.readUInt16LE(offset + 10);
                const lapDistance = msg.readFloatLE(offset + 12);
                const lapNum = msg.readUInt8(offset + 20);
                
                console.log(`  Last Lap Time (u32 @ +0):     ${lastLapTime} ms`);
                console.log(`  Current Lap Time (u32 @ +4):  ${currentLapTime} ms`);
                console.log(`  Sector 1 (u16 @ +8):          ${sector1} ms`);
                console.log(`  Sector 2 (u16 @ +10):         ${sector2} ms`);
                console.log(`  Lap Distance (f32 @ +12):     ${lapDistance.toFixed(1)} m`);
                console.log(`  Lap Number (u8 @ +20):        ${lapNum}`);
                
                // Check if realistic
                const realistic = currentLapTime < 300000 && 
                                lapNum >= 0 && lapNum < 100 &&
                                sector1 < 60000 && sector2 < 60000;
                
                if (realistic) {
                    console.log('  ✓ VALUES LOOK REALISTIC!');
                }
            }
        });
    } else {
        console.log('No lap data packet captured!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
    client.close();
    process.exit(0);
});

