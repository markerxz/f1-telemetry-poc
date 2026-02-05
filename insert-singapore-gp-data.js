/**
 * Insert Singapore GP 2025 Mock Data
 * Based on F1 2025 Singapore Grand Prix results
 */

const oracledb = require('oracledb');

// Singapore GP 2025 Grid (Top 10)
const drivers = [
    { name: 'Lando Norris', team: 'McLaren', position: 1 },
    { name: 'Max Verstappen', team: 'Red Bull Racing', position: 2 },
    { name: 'Oscar Piastri', team: 'McLaren', position: 3 },
    { name: 'George Russell', team: 'Mercedes', position: 4 },
    { name: 'Charles Leclerc', team: 'Ferrari', position: 5 },
    { name: 'Lewis Hamilton', team: 'Mercedes', position: 6 },
    { name: 'Carlos Sainz', team: 'Ferrari', position: 7 },
    { name: 'Fernando Alonso', team: 'Aston Martin', position: 8 },
    { name: 'Nico Hulkenberg', team: 'Haas', position: 9 },
    { name: 'Sergio Perez', team: 'Red Bull Racing', position: 10 }
];

// Realistic Singapore lap times (street circuit, ~1:30-1:35 range)
// Winner's average: ~1:42, fastest lap: ~1:30
function generateRealisticLapTime(driver, lapNumber, totalLaps = 62) {
    const baseTime = {
        'Lando Norris': 90500,      // 1:30.500 (fastest)
        'Max Verstappen': 90800,     // 1:30.800
        'Oscar Piastri': 91000,      // 1:31.000
        'George Russell': 91200,     // 1:31.200
        'Charles Leclerc': 91400,    // 1:31.400
        'Lewis Hamilton': 91300,     // 1:31.300
        'Carlos Sainz': 91500,       // 1:31.500
        'Fernando Alonso': 91700,    // 1:31.700
        'Nico Hulkenberg': 91900,    // 1:31.900
        'Sergio Perez': 91600        // 1:31.600
    };

    let lapTime = baseTime[driver] || 92000;

    // First lap is slower (traffic, cold tires)
    if (lapNumber === 1) {
        lapTime += 12000; // +12 seconds
    }
    // Laps 2-5: warming up
    else if (lapNumber <= 5) {
        lapTime += 3000 - (lapNumber * 500);
    }
    // Pit stop laps (assume pit on lap 20 and 40)
    else if (lapNumber === 20 || lapNumber === 40) {
        lapTime += 22000; // +22 seconds for pit stop
    }
    // Final 5 laps: pushing or fuel saving
    else if (lapNumber > totalLaps - 5) {
        lapTime += Math.random() * 2000; // Variable final laps
    }
    // Normal racing laps
    else {
        lapTime += (Math.random() - 0.5) * 1500; // +/- 0.75 seconds variation
    }

    return Math.round(lapTime);
}

// Generate sector times (roughly 1/3 each, but Singapore has varied sectors)
function generateSectorTimes(totalLapTime) {
    // Singapore sectors are roughly: 33%, 35%, 32%
    const sector1 = Math.round(totalLapTime * 0.33);
    const sector2 = Math.round(totalLapTime * 0.35);
    const sector3 = totalLapTime - sector1 - sector2;

    return { sector1, sector2, sector3 };
}

// Format lap time
function formatLapTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

async function insertSingaporeGPData() {
    let connection;

    try {
        console.log('=== Inserting Singapore GP 2025 Mock Data ===');
        console.log('');

        // Set wallet location
        process.env.TNS_ADMIN = 'C:\\NoSync\\F1\\Wallet_f1data';

        console.log('Connecting to database...');
        connection = await oracledb.getConnection({
            user: 'ADMIN',
            password: 'Mamarkrknstda4411!',
            connectString: 'f1data_tpurgent'
        });

        console.log('✓ Connected');
        console.log('');

        const sessionId = `SGP_RACE_2025_${Date.now()}`;
        const totalLaps = 62; // Singapore GP distance
        let totalInserted = 0;

        console.log(`Session ID: ${sessionId}`);
        console.log(`Inserting ${drivers.length} drivers × ${totalLaps} laps = ${drivers.length * totalLaps} records`);
        console.log('');

        // Insert laps for each driver
        for (const driver of drivers) {
            console.log(`Inserting laps for ${driver.name} (P${driver.position})...`);

            for (let lap = 1; lap <= totalLaps; lap++) {
                const lapTimeMs = generateRealisticLapTime(driver.name, lap, totalLaps);
                const sectors = generateSectorTimes(lapTimeMs);

                // Determine if lap is valid (invalid if pit stop or first lap issues)
                const isValid = (lap === 20 || lap === 40) ? 0 : 1;

                const sql = `INSERT INTO F1_LAP_TIMES (
                    SESSION_ID,
                    DRIVER_NAME,
                    TRACK_NAME,
                    SESSION_TYPE,
                    LAP_NUMBER,
                    LAP_TIME_MS,
                    LAP_TIME_FORMATTED,
                    SECTOR1_MS,
                    SECTOR2_MS,
                    SECTOR3_MS,
                    IS_VALID
                ) VALUES (
                    :sessionId,
                    :driverName,
                    :trackName,
                    :sessionType,
                    :lapNumber,
                    :lapTimeMs,
                    :lapTimeFormatted,
                    :sector1Ms,
                    :sector2Ms,
                    :sector3Ms,
                    :isValid
                )`;

                await connection.execute(sql, {
                    sessionId: sessionId,
                    driverName: driver.name,
                    trackName: 'Singapore',
                    sessionType: 'Race',
                    lapNumber: lap,
                    lapTimeMs: lapTimeMs,
                    lapTimeFormatted: formatLapTime(lapTimeMs),
                    sector1Ms: sectors.sector1,
                    sector2Ms: sectors.sector2,
                    sector3Ms: sectors.sector3,
                    isValid: isValid
                });

                totalInserted++;

                // Commit every 100 laps for performance
                if (totalInserted % 100 === 0) {
                    await connection.commit();
                    process.stdout.write(`\r  Progress: ${totalInserted}/${drivers.length * totalLaps} laps inserted...`);
                }
            }

            console.log(`\r  ✓ ${driver.name}: ${totalLaps} laps inserted`);
        }

        // Final commit
        await connection.commit();

        console.log('');
        console.log('=== Data Insertion Complete ===');
        console.log(`✓ Total laps inserted: ${totalInserted}`);
        console.log(`✓ Session ID: ${sessionId}`);
        console.log('');
        console.log('View the data:');
        console.log('  http://134.185.172.57:3000/lap-history.html');
        console.log('');

        // Show some stats
        const statsResult = await connection.execute(`
            SELECT 
                DRIVER_NAME,
                COUNT(*) as TOTAL_LAPS,
                MIN(LAP_TIME_MS) as BEST_LAP_MS,
                AVG(LAP_TIME_MS) as AVG_LAP_MS
            FROM F1_LAP_TIMES
            WHERE SESSION_ID = :sessionId
            AND IS_VALID = 1
            GROUP BY DRIVER_NAME
            ORDER BY MIN(LAP_TIME_MS) ASC
        `, { sessionId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        console.log('=== Race Statistics ===');
        console.log('');
        statsResult.rows.forEach((row, idx) => {
            console.log(`${idx + 1}. ${row.DRIVER_NAME.padEnd(20)} - Best: ${formatLapTime(row.BEST_LAP_MS)} - Avg: ${formatLapTime(Math.round(row.AVG_LAP_MS))}`);
        });

    } catch (err) {
        console.error('');
        console.error('=== Error ===');
        console.error(err.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

insertSingaporeGPData();
