#!/usr/bin/env node

/**
 * RAW HEX DUMPER - Shows FULL packet hex to reverse-engineer F1 2025 structure
 */

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

let packetCount = 0;
let packetsBySize = {};

client.on('listening', () => {
    console.log('\n🔍 RAW HEX DUMPER - Listening on 0.0.0.0:20777\n');
    console.log('Drive in F1 25, then press Ctrl+C to see analysis\n');
});

client.on('message', (msg, rinfo) => {
    packetCount++;
    const size = msg.length;
    
    // Group packets by size
    if (!packetsBySize[size]) {
        packetsBySize[size] = [];
    }
    
    // Store first 3 packets of each size for analysis
    if (packetsBySize[size].length < 3) {
        packetsBySize[size].push(msg);
    }
    
    // Show progress
    if (packetCount % 100 === 0) {
        process.stdout.write(`\rPackets received: ${packetCount}`);
    }
});

client.on('error', (err) => {
    console.error(`\n❌ Error: ${err}`);
    process.exit(1);
});

client.bind(20777, '0.0.0.0');

process.on('SIGINT', () => {
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('PACKET ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const sizes = Object.keys(packetsBySize).map(Number).sort((a, b) => a - b);
    
    sizes.forEach(size => {
        const packets = packetsBySize[size];
        console.log(`\n📦 SIZE: ${size} bytes (${packets.length} samples captured)`);
        console.log('─'.repeat(70));
        
        packets.forEach((pkt, idx) => {
            console.log(`\nSample ${idx + 1}:`);
            
            // Show header (first 32 bytes)
            console.log('HEADER (first 32 bytes):');
            const headerHex = pkt.slice(0, 32).toString('hex').match(/../g);
            for (let i = 0; i < 32; i += 16) {
                const line = headerHex.slice(i, i + 16).join(' ');
                const offset = i.toString().padStart(3, '0');
                console.log(`  ${offset}: ${line}`);
            }
            
            // Try to decode header
            console.log('\nHEADER DECODE ATTEMPTS:');
            console.log(`  Offset 0-1 (LE uint16): ${pkt.readUInt16LE(0)} (packet format?)`);
            console.log(`  Offset 2 (uint8): ${pkt.readUInt8(2)}`);
            console.log(`  Offset 3 (uint8): ${pkt.readUInt8(3)}`);
            console.log(`  Offset 4 (uint8): ${pkt.readUInt8(4)} (version?)`);
            console.log(`  Offset 5 (uint8): ${pkt.readUInt8(5)} (packet ID attempt 1)`);
            console.log(`  Offset 6 (uint8): ${pkt.readUInt8(6)} (packet ID attempt 2)`);
            console.log(`  Offset 7 (uint8): ${pkt.readUInt8(7)}`);
            
            // Guess packet type by size
            let guess = 'Unknown';
            if (size === 1349) guess = 'Likely TELEMETRY (ID 6)';
            if (size === 1285) guess = 'Likely MOTION (ID 0)';
            if (size === 1131) guess = 'Likely LAP DATA (ID 2)';
            if (size === 632) guess = 'Likely SESSION (ID 1)';
            if (size === 1460) guess = 'Likely MOTION (ID 0) or EVENT';
            if (size === 1352) guess = 'Likely CAR STATUS (ID 7)';
            if (size === 1239) guess = 'Likely PARTICIPANTS (ID 4)';
            if (size === 273) guess = 'Likely CAR DAMAGE (ID 10)';
            if (size === 45) guess = 'Likely EVENT (ID 3)';
            
            console.log(`  GUESS: ${guess}`);
        });
    });
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(`Total packets: ${packetCount}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    client.close();
    process.exit(0);
});

