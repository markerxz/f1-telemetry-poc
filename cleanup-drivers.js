/**
 * Clean up F1_LAP_TIMES:
 * 1. Remove all drivers except Max, Lewis, Lando, George
 * 2. Set specific lap times for them
 */
const oracledb = require('oracledb');

async function cleanupDatabase() {
    let connection;
    try {
        console.log('=== Cleaning up F1_LAP_TIMES ===');
        process.env.TNS_ADMIN = 'C:\\NoSync\\F1\\Wallet_f1data';

        connection = await oracledb.getConnection({
            user: 'ADMIN',
            password: 'Mamarkrknstda4411!',
            connectString: 'f1data_tpurgent'
        });

        console.log('✓ Connected');

        // 1. Delete others
        const deleteSQL = `
            DELETE FROM F1_LAP_TIMES 
            WHERE DRIVER_NAME NOT IN ('Max Verstappen', 'Lewis Hamilton', 'Lando Norris', 'George Russell')
        `;
        const delResult = await connection.execute(deleteSQL);
        console.log(`✓ Deleted ${delResult.rowsAffected} other drivers`);

        // 2. Update specific times
        const drivers = [
            { name: 'Max Verstappen', time: '1:40.000', ms: 100000 },
            { name: 'Lewis Hamilton', time: '1:41.000', ms: 101000 },
            { name: 'Lando Norris', time: '1:42.000', ms: 102000 },
            { name: 'George Russell', time: '1:43.000', ms: 103000 }
        ];

        for (const d of drivers) {
            const updateSQL = `
                UPDATE F1_LAP_TIMES 
                SET LAP_TIME_FORMATTED = :time,
                    LAP_TIME_MS = :ms,
                    CREATED_AT = TO_TIMESTAMP('2026-01-12 12:00:00', 'YYYY-MM-DD HH24:MI:SS'),
                    SESSION_TIMESTAMP = TO_TIMESTAMP('2026-01-12 12:00:00', 'YYYY-MM-DD HH24:MI:SS')
                WHERE DRIVER_NAME = :name
            `;
            const res = await connection.execute(updateSQL, { time: d.time, ms: d.ms, name: d.name });

            // If the driver doesn't exist (e.g. was deleted or never there), insert a fresh record
            if (res.rowsAffected === 0) {
                console.log(`! ${d.name} not found, inserting fresh record...`);
                const insertSQL = `
                    INSERT INTO F1_LAP_TIMES (
                        SESSION_ID, DRIVER_NAME, TRACK_NAME, SESSION_TYPE, 
                        LAP_NUMBER, LAP_TIME_MS, LAP_TIME_FORMATTED, 
                        CREATED_AT, SESSION_TIMESTAMP
                    ) VALUES (
                        'CLEANUP_SESSION', :name, 'Singapore', 'Practice',
                        1, :ms, :time,
                        TO_TIMESTAMP('2026-01-12 12:00:00', 'YYYY-MM-DD HH24:MI:SS'),
                        TO_TIMESTAMP('2026-01-12 12:00:00', 'YYYY-MM-DD HH24:MI:SS')
                    )
                `;
                await connection.execute(insertSQL, { name: d.name, ms: d.ms, time: d.time });
            }
        }

        await connection.commit();
        console.log('✓ Database cleanup and updates complete');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) await connection.close();
    }
}

cleanupDatabase();
