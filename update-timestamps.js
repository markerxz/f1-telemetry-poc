/**
 * Update all CREATED_AT timestamps in F1_LAP_TIMES to Jan 12, 2025
 */

const oracledb = require('oracledb');

async function updateTimestamps() {
    let connection;
    try {
        console.log('=== Updating F1_LAP_TIMES Timestamps ===');
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

        // Update timestamps
        console.log('Updating all records to Jan 12, 2026...');
        const updateSQL = `
            UPDATE F1_LAP_TIMES 
            SET CREATED_AT = TO_TIMESTAMP('2026-01-12 12:00:00', 'YYYY-MM-DD HH24:MI:SS'),
                SESSION_TIMESTAMP = TO_TIMESTAMP('2026-01-12 12:00:00', 'YYYY-MM-DD HH24:MI:SS')
        `;

        const result = await connection.execute(updateSQL);
        await connection.commit();

        console.log(`✓ Updated ${result.rowsAffected} records`);
        console.log('');
        console.log('=== Update Complete ===');

    } catch (err) {
        console.error('');
        console.error('=== Update FAILED ===');
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

updateTimestamps();
