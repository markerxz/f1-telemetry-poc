const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASSWORD || 'Mamarkrknstda4411!',
    connectString: process.env.DB_CONNECT_STRING || 'f1data_tpurgent',
    walletLocation: process.env.WALLET_LOCATION || '/home/opc/.oracle/wallets/f1data_wallet'
};

async function runMigration() {
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

        console.log('Connected. Adding EVENT_NAME column...');

        try {
            await connection.execute(`ALTER TABLE F1_LAP_TIMES ADD (EVENT_NAME VARCHAR2(100))`);
            console.log('Added column EVENT_NAME');
        } catch (err) {
            if (err.message.includes('ORA-01430')) {
                console.log('Column EVENT_NAME already exists.');
            } else {
                throw err;
            }
        }

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
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

runMigration();
