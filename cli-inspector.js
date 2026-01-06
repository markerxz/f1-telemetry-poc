const dgram = require('dgram');

// Configuration
const PORT = 20777;
const HOST = '0.0.0.0';

const client = dgram.createSocket('udp4');

client.on('listening', () => {
    const address = client.address();
    console.log(`\n🔍 RAW F1 PACKET INSPECTOR listening on ${address.address}:${address.port}`);
    console.log(`Waiting for ANY data...\n`);
});

let packetCount = 0;

client.on('message', (msg, rinfo) => {
    packetCount++;
    
    // NO LIMITER - Show every single packet
    const packetFormat = msg.readUInt16LE(0);
    const packetId = msg.readUInt8(5);
    const playerIdx = msg.readUInt8(21);

    const packetNames = [
        "Motion",        // 0
        "Session",       // 1
        "Lap Data",      // 2
        "Event",         // 3
        "Participants",  // 4
        "Car Setups",    // 5
        "Car Telemetry", // 6
        "Car Status",    // 7
        "Final Class",   // 8
        "Lobby Info",    // 9
        "Car Damage",    // 10
        "Session Hist",  // 11
        "Tyre Sets",     // 12
        "Motion Ex"      // 13
    ];
    
    const packetName = packetNames[packetId] || "Unknown";

    console.log(`📦 #${packetCount} [${packetName}] ID:${packetId} Size:${msg.length} Fmt:${packetFormat}`);

    // If it is Telemetry (6), decode speed immediately to prove it works
    if (packetId === 6) {
        // Offset 29 (Header) + Index * 60 (Car Size 2024)
        // Speed is first 2 bytes of car data
        const offset = 29 + (playerIdx * 60);
        if (msg.length >= offset + 2) {
            const speed = msg.readUInt16LE(offset);
            const throttle = msg.readFloatLE(offset + 2);
            console.log(`   🚀 SPEED: ${speed} km/h | THROTTLE: ${throttle.toFixed(2)}`);
        }
    }
});

client.on('error', (err) => {
    console.log(`Server error:\n${err.stack}`);
    client.close();
});

client.bind(PORT, HOST);
