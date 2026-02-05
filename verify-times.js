/**
 * Verify driver times in F1_LAP_TIMES
 */
const oracledb = require('oracledb');

async function verifyTimes() {
    let connection;
    try {
        process.env.TNS_ADMIN = 'C:\\NoSync\\F1\\Wallet_f1data';
        connection = await oracledb.getConnection({
            user: 'ADMIN',
            password: 'Mamarkrknstda4411!',
            connectString: 'f1data_tpurgent'
        });

        const result = await connection.execute(`
            SELECT DRIVER_NAME, LAP_TIME_FORMATTED, TO_CHAR(CREATED_AT, 'YYYY-MM-DD') as CREATED_DATE 
            FROM F1_LAP_TIMES
        `);
        console.log('Driver Times:', result.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) await connection.close();
    }
}

verifyTimes();
