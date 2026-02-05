const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASSWORD || 'Mamarkrknstda4411!',
    connectString: process.env.DB_CONNECT_STRING || 'f1data_tpurgent',
    walletLocation: process.env.WALLET_LOCATION || '/home/opc/.oracle/wallets/f1data_wallet'
};

async function renumberSessions() {
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

        console.log('Connected. Fetching unique sessions...');

        // 1. Get all distinct session IDs ordered by their first appearance (min created_at)
        const sessionsResult = await connection.execute(
            `SELECT SESSION_ID, MIN(CREATED_AT) as FIRST_LAP_TIME 
             FROM F1_LAP_TIMES 
             GROUP BY SESSION_ID 
             ORDER BY FIRST_LAP_TIME ASC`
        );

        const sessions = sessionsResult.rows; // Array of [SESSION_ID, TIMESTAMP]
        console.log(`Found ${sessions.length} unique sessions.`);

        // 2. Update each session with a running number (1, 2, 3...)
        let counter = 1;
        for (const row of sessions) {
            const oldSessionId = row[0];
            const newSessionId = counter.toString(); // "1", "2", ...

            console.log(`Renaming session '${oldSessionId}' to '${newSessionId}'...`);

            await connection.execute(
                `UPDATE F1_LAP_TIMES SET SESSION_ID = :newId WHERE SESSION_ID = :oldId`,
                { newId: newSessionId, oldId: oldSessionId },
                { autoCommit: true }
            );
            counter++;
        }

        console.log('✓ Session renumbering complete.');

    } catch (err) {
        console.error('Renumbering failed:', err);
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

renumberSessions();
