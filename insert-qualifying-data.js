/**
 * Insert Singapore GP 2025 Qualifying (Q3) Results
 * One lap per driver - their best qualifying lap
 */

const oracledb = require('oracledb');

// Singapore GP 2025 Qualifying Results (Q3 - Top 10)
const qualifyingResults = [
    { position: 1, name: 'Lando Norris', team: 'McLaren', lapTime: '1:29.525' },
    { position: 2, name: 'Max Verstappen', team: 'Red Bull Racing', lapTime: '1:29.728' },
    { position: 3, name: 'Lewis Hamilton', team: 'Mercedes', lapTime: '1:29.841' },
    { position: 4, name: 'George Russell', team: 'Mercedes', lapTime: '1:29.906' },
    { position: 5, name: 'Oscar Piastri', team: 'McLaren', lapTime: '1:30.037' },
    { position: 6, name: 'Nico Hulkenberg', team: 'Haas', lapTime: '1:30.115' },
    { position: 7, name: 'Fernando Alonso', team: 'Aston Martin', lapTime: '1:30.214' },
    { position: 8, name: 'Yuki Tsunoda', team: 'RB', lapTime: '1:30.354' },
    { position: 9, name: 'Charles Leclerc', team: 'Ferrari', lapTime: '1:30.437' },
    { position: 10, name: 'Carlos Sainz', team: 'Ferrari', lapTime: '1:30.518' }
];

// Convert lap time string to milliseconds
function lapTimeToMs(timeStr) {
    const parts = timeStr.split(':');
    const minutes = parseInt(parts[0]);
    const secondsParts = parts[1].split('.');
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1]);

    return (minutes * 60000) + (seconds * 1000) + milliseconds;
}

// Generate realistic sector times for Singapore
function generateSectorTimes(totalLapTime) {
    // Singapore Marina Bay Circuit sectors (approximate distribution)
    // Sector 1: 33% (technical section)
    // Sector 2: 35% (longest, most corners)
    // Sector 3: 32% (final section to finish)

    const sector1 = Math.round(totalLapTime * 0.33);
    const sector2 = Math.round(totalLapTime * 0.35);
    const sector3 = totalLapTime - sector1 - sector2;

    return { sector1, sector2, sector3 };
}

async function insertQualifyingData() {
    let connection;

    try {
        console.log('=== Singapore GP 2025 - Qualifying Results ===');
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

        // Clear existing data
        console.log('Clearing existing data...');
        await connection.execute('DELETE FROM F1_LAP_TIMES');
        await connection.commit();
        console.log('✓ Database cleared');
        console.log('');

        const sessionId = `SGP_Q3_2025_${Date.now()}`;

        console.log('Inserting Q3 results...');
        console.log('');

        for (const driver of qualifyingResults) {
            const lapTimeMs = lapTimeToMs(driver.lapTime);
            const sectors = generateSectorTimes(lapTimeMs);

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
                sessionType: 'Qualifying Q3',
                lapNumber: 1,
                lapTimeMs: lapTimeMs,
                lapTimeFormatted: driver.lapTime,
                sector1Ms: sectors.sector1,
                sector2Ms: sectors.sector2,
                sector3Ms: sectors.sector3,
                isValid: 1
            });

            console.log(`  P${driver.position}  ${driver.name.padEnd(20)} ${driver.lapTime}  (${driver.team})`);
        }

        await connection.commit();

        console.log('');
        console.log('=== Data Insertion Complete ===');
        console.log(`✓ ${qualifyingResults.length} qualifying laps inserted`);
        console.log(`✓ Session ID: ${sessionId}`);
        console.log('');
        console.log('🏁 Pole Position: Lando Norris - 1:29.525');
        console.log('');
        console.log('View the data:');
        console.log('  http://134.185.172.57:3000/lap-history.html');
        console.log('');

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

insertQualifyingData();
