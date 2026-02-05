/**
 * List current drivers in F1_LAP_TIMES
 */
const oracledb = require('oracledb');

async function listDrivers() {
    let connection;
    try {
        process.env.TNS_ADMIN = 'C:\\NoSync\\F1\\Wallet_f1data';
        connection = await oracledb.getConnection({
            user: 'ADMIN',
            password: 'Mamarkrknstda4411!',
            connectString: 'f1data_tpurgent'
        });

        const result = await connection.execute(`SELECT DISTINCT DRIVER_NAME FROM F1_LAP_TIMES`);
        console.log('Current Drivers:', result.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) await connection.close();
    }
}

listDrivers();
