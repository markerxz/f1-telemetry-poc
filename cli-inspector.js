const dgram = require('dgram');

// Configuration
const PORT = 20777;
const HOST = '0.0.0.0';

const client = dgram.createSocket('udp4');

// Track IDs for F1 25
const TRACKS = {
    0: 'Melbourne', 1: 'Paul Ricard', 2: 'Shanghai', 3: 'Bahrain', 4: 'Catalunya',
    5: 'Monaco', 6: 'Montreal', 7: 'Silverstone', 8: 'Hockenheim', 9: 'Hungaroring',
    10: 'Spa', 11: 'Monza', 12: 'Singapore', 13: 'Suzuka', 14: 'Abu Dhabi',
    15: 'Texas', 16: 'Brazil', 17: 'Austria', 18: 'Sochi', 19: 'Mexico',
    20: 'Baku', 21: 'Sakhir Short', 22: 'Silverstone Short', 23: 'Texas Short',
    24: 'Suzuka Short', 25: 'Hanoi', 26: 'Zandvoort', 27: 'Imola', 28: 'Portimão',
    29: 'Jeddah', 30: 'Miami', 31: 'Las Vegas', 32: 'Losail'
};

// State
let lastSession = { track: 'Unknown', type: 'Unknown' };
let lastLap = { current: 0, last: 0, best: 0, sector1: 0, sector2: 0 };
let lastTelemetry = { speed: 0, throttle: 0, brake: 0, gear: 0, rpm: 0 };

function formatTime(ms) {
    if (!ms) return '--:--.---';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const mil = ms % 1000;
    return `${min}:${sec.toString().padStart(2, '0')}.${mil.toString().padStart(3, '0')}`;
}

client.on('listening', () => {
    const address = client.address();
    console.log(`\n🏎️  F1 CLI Inspector listening on ${address.address}:${address.port}`);
    console.log(`Waiting for F1 25 data...\n`);
});

client.on('message', (msg, rinfo) => {
    if (msg.length < 24) return;

    // Parse Header
    const packetFormat = msg.readUInt16LE(0); // 2024/2025
    const packetId = msg.readUInt8(5);
    const playerIdx = msg.readUInt8(21); // Updated offset for 2024 spec

    // 1. Session Packet (ID 1)
    if (packetId === 1) {
        const trackId = msg.readInt8(29); // Offset for track ID
        lastSession.track = TRACKS[trackId] || `Unknown (${trackId})`;
    }

    // 2. Lap Data Packet (ID 2)
    if (packetId === 2) {
        // Lap data starts after header (29 bytes)
        // Each car's lap data is 56 bytes (2024 spec)
        const offset = 29 + (playerIdx * 56); 
        
        if (msg.length >= offset + 56) {
            lastLap.last = msg.readUInt32LE(offset + 0);
            lastLap.current = msg.readUInt32LE(offset + 4);
            lastLap.sector1 = msg.readUInt16LE(offset + 8);
            lastLap.sector2 = msg.readUInt16LE(offset + 10);
        }
    }

    // 6. Car Telemetry Packet (ID 6)
    if (packetId === 6) {
        // Telemetry starts after header (29 bytes)
        // Each car's telemetry is 60 bytes
        const offset = 29 + (playerIdx * 60);

        if (msg.length >= offset + 60) {
            lastTelemetry.speed = msg.readUInt16LE(offset + 0);
            lastTelemetry.throttle = msg.readFloatLE(offset + 2);
            lastTelemetry.brake = msg.readFloatLE(offset + 10);
            lastTelemetry.gear = msg.readInt8(offset + 15);
            lastTelemetry.rpm = msg.readUInt16LE(offset + 16);

            // Print output every time we get telemetry (approx 20-60Hz)
            printStatus();
        }
    }
});

let lastPrint = 0;
function printStatus() {
    const now = Date.now();
    if (now - lastPrint < 100) return; // Limit to 10fps drawing
    lastPrint = now;

    console.clear();
    console.log(`╔════════════════════ F1 25 CLI INSPECTOR ════════════════════╗`);
    console.log(`║ Track:    ${lastSession.track.padEnd(20)}                              ║`);
    console.log(`╟─────────────────────────────────────────────────────────────╢`);
    console.log(`║ Speed:    ${lastTelemetry.speed.toString().padStart(3)} km/h   |   RPM: ${lastTelemetry.rpm.toString().padStart(5)}   |   Gear: ${lastTelemetry.gear}      ║`);
    console.log(`║ Throttle: ${(lastTelemetry.throttle * 100).toFixed(0).padStart(3)} %      |   Brake: ${(lastTelemetry.brake * 100).toFixed(0).padStart(3)} %                    ║`);
    console.log(`╟─────────────────────────────────────────────────────────────╢`);
    console.log(`║ Current Lap: ${formatTime(lastLap.current)}                                  ║`);
    console.log(`║ Last Lap:    ${formatTime(lastLap.last)}                                  ║`);
    console.log(`║ Sector 1:    ${formatTime(lastLap.sector1)}                                  ║`);
    console.log(`║ Sector 2:    ${formatTime(lastLap.sector2)}                                  ║`);
    console.log(`╚═════════════════════════════════════════════════════════════╝`);
    console.log(`\nReceiving data... Press Ctrl+C to stop.`);
}

// Handle errors
client.on('error', (err) => {
    console.log(`Server error:\n${err.stack}`);
    client.close();
});

client.bind(PORT, HOST);

