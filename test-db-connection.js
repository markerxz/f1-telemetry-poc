/**
 * Test Database Connection to AIS Cloud f1data
 */

const oracledb = require('oracledb');

async function testConnection() {
    try {
        console.log('=== Testing AIS Cloud Database Connection ===');
        console.log('Database: f1data');
        console.log('Region: ap-pathumthani-1 (AIS Cloud Thailand)');
        console.log('');

        // Set wallet location
        process.env.TNS_ADMIN = 'C:\\NoSync\\F1\\Wallet_f1data';

        console.log('Wallet Location:', process.env.TNS_ADMIN);
        console.log('TNS Alias: f1data_tpurgent');
        console.log('');

        console.log('Attempting connection...');
        const connection = await oracledb.getConnection({
            user: 'ADMIN',
            password: 'Mamarkrknstda4411!',
            connectString: 'f1data_tpurgent'
        });

        console.log('✓ Connection successful!');
        console.log('');

        // Test query
        console.log('Running test query...');
        const result = await connection.execute('SELECT 1 AS TEST FROM DUAL');
        console.log('✓ Test query successful:', result.rows[0]);
        console.log('');

        // Check if table exists
        console.log('Checking for F1_LAP_TIMES table...');
        const tableCheck = await connection.execute(
            `SELECT table_name FROM user_tables WHERE table_name = 'F1_LAP_TIMES'`
        );

        if (tableCheck.rows.length > 0) {
            console.log('✓ F1_LAP_TIMES table exists');

            // Count rows
            const countResult = await connection.execute(
                `SELECT COUNT(*) as count FROM F1_LAP_TIMES`
            );
            console.log(`  Total laps in database: ${countResult.rows[0][0]}`);
        } else {
            console.log('⚠ F1_LAP_TIMES table does NOT exist - needs to be created');
        }

        await connection.close();
        console.log('');
        console.log('=== Connection Test Complete ===');
        console.log('✓ All tests passed!');

    } catch (err) {
        console.error('');
        console.error('=== Connection Test FAILED ===');
        console.error('Error:', err.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Check wallet files are in C:\\NoSync\\F1\\Wallet_f1data');
        console.error('2. Verify database password is correct');
        console.error('3. Ensure network access to AIS Cloud is allowed');
        process.exit(1);
    }
}

testConnection();
