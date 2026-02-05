const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASSWORD || 'Mamarkrknstda4411!',
    connectString: process.env.DB_CONNECT_STRING || 'f1data_tpurgent',
    walletLocation: process.env.WALLET_LOCATION || '/home/opc/.oracle/wallets/f1data_wallet'
};

async function checkStructure() {
    let connection;
    try {
        console.log('Connecting to database to check structure...');
        if (process.platform === 'linux') {
            process.env.TNS_ADMIN = dbConfig.walletLocation;
        }

        connection = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        });

        // Query columns for F1_LAP_TIMES
        const result = await connection.execute(
            `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH 
             FROM USER_TAB_COLUMNS 
             WHERE TABLE_NAME = 'F1_LAP_TIMES'
             ORDER BY COLUMN_ID`
        );

        console.log('\nTable Structure: F1_LAP_TIMES');
        console.log('------------------------------------------------');
        console.log('| Column Name                    | Type         |');
        console.log('------------------------------------------------');
        result.rows.forEach(row => {
            console.log(`| ${row[0].padEnd(30)} | ${row[1].padEnd(12)} |`);
        });
        console.log('------------------------------------------------');

    } catch (err) {
        console.error('Error checking structure:', err);
    } finally {
        if (connection) await connection.close();
    }
}

checkStructure();
