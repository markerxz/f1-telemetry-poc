const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASSWORD || 'Mamarkrknstda4411!',
    connectString: process.env.DB_CONNECT_STRING || 'f1data_tpurgent',
    walletLocation: process.env.WALLET_LOCATION || '/home/opc/.oracle/wallets/f1data_wallet'
};

async function verifyIntegrity() {
    let connection;
    try {
        console.log('Connecting...');
        if (process.platform === 'linux') {
            process.env.TNS_ADMIN = dbConfig.walletLocation;
        }

        connection = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        });

        // Check for duplicates
        console.log('Checking for duplicate LAP_IDs...');
        const result = await connection.execute(
            `SELECT LAP_ID, COUNT(*) 
             FROM F1_LAP_TIMES 
             GROUP BY LAP_ID 
             HAVING COUNT(*) > 1`
        );

        if (result.rows.length > 0) {
            console.error('ALARM: Found duplicate LAP_IDs!');
            console.table(result.rows);
        } else {
            console.log('✓ No duplicate LAP_IDs found.');
        }

        // Check Max ID
        const maxResult = await connection.execute('SELECT MAX(LAP_ID) FROM F1_LAP_TIMES');
        console.log(`Current Max LAP_ID: ${maxResult.rows[0][0]}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) await connection.close();
    }
}

verifyIntegrity();
