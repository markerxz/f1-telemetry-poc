#!/usr/bin/env node

/**
 * Packet Analyzer - Shows what packets are actually being received
 */

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

let packetStats = {};
let totalPackets = 0;
let sessionSample = null;

client.on('listening', () => {
    console.log('\n🔍 PACKET ANALYZER - Listening on 0.0.0.0:20777\n');
    console.log('Drive in F1 25 for 10 seconds, then press Ctrl+C\n');
});

client.on('message', (msg, rinfo) => {
    totalPackets++;
    
    if (msg.length < 29) return;
    
    const packetId = msg.readUInt8(6);
    const size = msg.length;
    const key = `ID:${packetId} Size:${size}`;
    
    if (!packetStats[key]) {
        packetStats[key] = {
            count: 0,
            packetId: packetId,
            size: size,
            sample: msg
        };
    }
    packetStats[key].count++;
    
    // Capture session packet for detailed analysis
    if (packetId === 1 && !sessionSample) {
        sessionSample = msg;
    }
    
    if (totalPackets % 100 === 0) {
        process.stdout.write(`\rPackets: ${totalPackets}`);
    }
});

client.on('error', (err) => {
    console.error(`\n❌ Error: ${err}`);
    process.exit(1);
});

client.bind(20777, '0.0.0.0');

process.on('SIGINT', () => {
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('PACKET STATISTICS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const sorted = Object.values(packetStats).sort((a, b) => b.count - a.count);
    
    sorted.forEach(stat => {
        const pct = ((stat.count / totalPackets) * 100).toFixed(1);
        console.log(`${stat.count.toString().padStart(5)} packets (${pct.padStart(5)}%) | ID: ${stat.packetId.toString().padStart(2)} | Size: ${stat.size.toString().padStart(4)} bytes`);
    });
    
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`TOTAL: ${totalPackets} packets`);
    
    // Analyze session packet in detail
    if (sessionSample) {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('SESSION PACKET ANALYSIS (ID 1)');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        console.log('First 64 bytes:');
        const hex = sessionSample.slice(0, 64).toString('hex').match(/../g);
        for (let i = 0; i < 64; i += 16) {
            const line = hex.slice(i, i + 16).join(' ');
            const offset = i.toString().padStart(3, '0');
            console.log(`  ${offset}: ${line}`);
        }
        
        console.log('\nTrying different track ID offsets:');
        for (let offset = 29; offset < 40; offset++) {
            const trackId = sessionSample.readInt8(offset);
            const trackNames = {
                0: 'Melbourne', 1: 'Paul Ricard', 2: 'Shanghai', 3: 'Bahrain', 4: 'Barcelona',
                5: 'Monaco', 6: 'Montreal', 7: 'Silverstone', 8: 'Hockenheim', 9: 'Hungaroring',
                10: 'Spa', 11: 'Monza', 12: 'Singapore', 13: 'Suzuka', 14: 'Abu Dhabi',
                15: 'Texas', 16: 'Brazil', 17: 'Austria', 18: 'Sochi', 19: 'Mexico',
                20: 'Baku', 21: 'Bahrain Short', 22: 'Silverstone Short', 23: 'Texas Short',
                24: 'Suzuka Short', 25: 'Hanoi', 26: 'Zandvoort', 27: 'Imola', 28: 'Portimao',
                29: 'Jeddah', 30: 'Miami', 31: 'Las Vegas', 32: 'Losail'
            };
            const trackName = trackNames[trackId] || `Unknown (${trackId})`;
            const marker = trackId === 12 ? ' ← SINGAPORE!' : '';
            console.log(`  Offset ${offset}: ${trackId.toString().padStart(3)} = ${trackName}${marker}`);
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
    client.close();
    process.exit(0);
});

