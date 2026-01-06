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
    
    // Only log every 60th packet to avoid flooding (approx 1 per second)
    // BUT log the first 5 packets immediately so we see if connection works
    if (packetCount > 5 && packetCount % 60 !== 0) return;

    console.log(`\n📦 Packet #${packetCount} from ${rinfo.address}:${rinfo.port}`);
    console.log(`   Size: ${msg.length} bytes`);

    if (msg.length < 24) {
        console.log(`   ⚠️ TOO SHORT (<24 bytes)`);
        return;
    }

    // Header Parsing (F1 2024 Format)
    // struct PacketHeader
    // {
    //     uint16 m_packetFormat;             // 2024
    //     uint8  m_gameMajorVersion;         // Game major version - "X.00"
    //     uint8  m_gameMinorVersion;         // Game minor version - "1.XX"
    //     uint8  m_packetVersion;            // Version of this packet type, usually starts at 1
    //     uint8  m_packetId;                 // Identifier for the packet type
    //     uint64 m_sessionUID;               // Unique identifier for the session
    //     float  m_sessionTime;              // Session timestamp
    //     uint32 m_frameIdentifier;          // Identifier for the frame the data was retrieved on
    //     uint32 m_overallFrameIdentifier;   // Overall identifier for the frame the data was retrieved on, doesn't go back after flashbacks
    //     uint8  m_playerCarIndex;           // Index of player's car in the array
    //     uint8  m_secondaryPlayerCarIndex;  // Index of secondary player's car in the array (splitscreen)
    //                                        // 2024 totals 29 bytes
    // };

    const packetFormat = msg.readUInt16LE(0);
    const packetId = msg.readUInt8(5);
    const playerIdx = msg.readUInt8(21); // Updated offset for 2024

    console.log(`   Format: ${packetFormat} | ID: ${packetId} | PlayerIdx: ${playerIdx}`);

    // Hex dump first 32 bytes to inspect header manually
    console.log(`   HEX: ${msg.slice(0, 32).toString('hex').match(/../g).join(' ')}...`);

    if (packetId === 6) { // Telemetry
        console.log(`   --> [TELEMETRY PACKET]`);
        // Try decoding speed at standard offset (Header 29 + Index*60)
        const offset = 29 + (playerIdx * 60);
        if (msg.length >= offset + 2) {
             const speed = msg.readUInt16LE(offset);
             console.log(`       Decoded Speed: ${speed} km/h (Offset ${offset})`);
        }
    }
});

client.on('error', (err) => {
    console.log(`Server error:\n${err.stack}`);
    client.close();
});

client.bind(PORT, HOST);
