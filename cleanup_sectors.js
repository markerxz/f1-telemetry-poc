const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASSWORD || 'Mamarkrknstda4411!',
    connectString: process.env.DB_CONNECT_STRING || 'f1data_tpurgent',
    walletLocation: process.env.WALLET_LOCATION || '/home/opc/.oracle/wallets/f1data_wallet'
};

async function cleanData() {
    let connection;

    try {
        console.log('Initializing database connection...');
        if (process.platform === 'linux') {
            process.env.TNS_ADMIN = dbConfig.walletLocation;
        }

        connection = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        });

        console.log('Connected. Checking for records with 0ms sectors...');

        // Count first
        const countResult = await connection.execute(
            `SELECT COUNT(*) FROM F1_LAP_TIMES 
             WHERE SECTOR1_MS = 0 OR SECTOR2_MS = 0 OR SECTOR3_MS = 0`
        );

        const count = countResult.rows[0][0];
        console.log(`Found ${count} records containing 0ms value in at least one sector.`);

        if (count > 0) {
            console.log('Deleting records...');
            const deleteResult = await connection.execute(
                `DELETE FROM F1_LAP_TIMES 
                 WHERE SECTOR1_MS = 0 OR SECTOR2_MS = 0 OR SECTOR3_MS = 0`,
                {},
                { autoCommit: true }
            );
            console.log(`✓ Successfully deleted ${deleteResult.rowsAffected} records.`);
        } else {
            console.log('No invalid records found. Database is clean.');
        }

    } catch (err) {
        console.error('Cleanup failed:', err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

cleanData();
