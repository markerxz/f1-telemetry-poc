const dgram = require('dgram');
const client = dgram.createSocket('udp4');

client.on('listening', () => console.log(`\n🔍 HEX SCANNER listening on 20777...`));

let count = 0;

client.on('message', (msg, rinfo) => {
    count++;
    
    // Packet ID at offset 5 (standard)
    const standardId = msg.readUInt8(5);
    
    // Packet size
    const size = msg.length;
    
    // Guess packet type by size (based on 2024 spec)
    let guess = "Unknown";
    if (size === 1349) guess = "Likely Telemetry (ID 6)";
    if (size === 1460) guess = "Likely Motion (ID 0) / MTU";
    if (size === 1285) guess = "Likely Motion (ID 0)";
    if (size === 632)  guess = "Likely Session (ID 1)";
    if (size === 1131) guess = "Likely LapData (ID 2)";

    console.log(`\n📦 #${count} Size:${size} | Read ID:${standardId} | Guess: ${guess}`);
    
    // Dump first 16 bytes
    console.log(`   HEX: ${msg.slice(0, 16).toString('hex').match(/../g).join(' ')}`);
    console.log(`        00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15`);
    console.log(`                       ^^ ID?`);
});

client.bind(20777, '0.0.0.0');
