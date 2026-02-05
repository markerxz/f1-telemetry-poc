const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASSWORD || 'Mamarkrknstda4411!',
    connectString: process.env.DB_CONNECT_STRING || 'f1data_tpurgent',
    walletLocation: process.env.WALLET_LOCATION || '/home/opc/.oracle/wallets/f1data_wallet'
};

const mockData = {
    driverName: "Mark Oracle",
    sessionType: "Mock Test",
    trackName: "Singapore",
    eventName: "Manual Insert Test",
    lapNumber: 2,
    // Lap Time: 3:00.000 = 180,000 ms
    lapTimeMs: 180000,
    lapTimeFormatted: "3:00.000",

    // Sector 1: 1:00.000 = 60,000 ms
    sector1Ms: 60000,
    sector1Formatted: "1:00.000",

    // Sector 2: 1:00.000 = 60,000 ms
    sector2Ms: 60000,
    sector2Formatted: "1:00.000",

    // Sector 3: 1:00.000 = 60,000 ms
    sector3Ms: 60000,
    sector3Formatted: "1:00.000",

    isValid: 1
};

async function insertMockLap() {
    let connection;

    try {
        console.log('Connecting to database...');
        if (process.platform === 'linux') {
            process.env.TNS_ADMIN = dbConfig.walletLocation;
        }

        connection = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        });

        // 1. Get Max ID for Manual Insert Logic (mimicking application logic)
        const idResult = await connection.execute('SELECT MAX(LAP_ID) FROM ADMIN.F1_LAP_TIMES');
        let nextId = 1;
        if (idResult.rows.length > 0 && idResult.rows[0][0] !== null) {
            nextId = idResult.rows[0][0] + 1;
        }
        console.log(`Calculated Next LAP_ID: ${nextId}`);

        // 2. Get the latest SESSION_ID to append to, or create new "12" if we follow sequence
        // For this mock, let's just use "999" to stand out, or latest + 1. 
        // Let's match the user's request context: "new data". 
        // Let's find distinct max numeric session id.
        const sessionResult = await connection.execute(`
            SELECT MAX(TO_NUMBER(SESSION_ID)) FROM F1_LAP_TIMES 
            WHERE REGEXP_LIKE(SESSION_ID, '^[0-9]+$')
        `);

        let nextSessionId = "99"; // Fallback
        if (sessionResult.rows.length > 0 && sessionResult.rows[0][0] !== null) {
            nextSessionId = (sessionResult.rows[0][0] + 1).toString();
        }
        console.log(`Calculated Next SESSION_ID: ${nextSessionId}`);


        // 3. Insert Data
        const sql = `INSERT INTO ADMIN.F1_LAP_TIMES (
            LAP_ID,
            SESSION_ID,
            DRIVER_NAME,
            SESSION_TIMESTAMP,
            TRACK_NAME,
            SESSION_TYPE,
            LAP_NUMBER,
            LAP_TIME_MS,
            LAP_TIME_FORMATTED,
            SECTOR1_MS,
            SECTOR2_MS,
            SECTOR3_MS,
            SECTOR1_FORMATTED,
            SECTOR2_FORMATTED,
            SECTOR3_FORMATTED,
            EVENT_NAME,
            IS_VALID
        ) VALUES (
            :lapId,
            :sessionId,
            :driverName,
            CURRENT_TIMESTAMP,
            :trackName,
            :sessionType,
            :lapNumber,
            :lapTimeMs,
            :lapTimeFormatted,
            :sector1Ms,
            :sector2Ms,
            :sector3Ms,
            :sector1Formatted,
            :sector2Formatted,
            :sector3Formatted,
            :eventName,
            :isValid
        )`;

        const binds = {
            lapId: nextId,
            sessionId: nextSessionId,
            driverName: mockData.driverName,
            trackName: mockData.trackName,
            sessionType: mockData.sessionType,
            lapNumber: mockData.lapNumber,
            lapTimeMs: mockData.lapTimeMs,
            lapTimeFormatted: mockData.lapTimeFormatted,
            sector1Ms: mockData.sector1Ms,
            sector2Ms: mockData.sector2Ms,
            sector3Ms: mockData.sector3Ms,
            sector1Formatted: mockData.sector1Formatted,
            sector2Formatted: mockData.sector2Formatted,
            sector3Formatted: mockData.sector3Formatted,
            eventName: mockData.eventName,
            isValid: mockData.isValid
        };

        const result = await connection.execute(sql, binds, { autoCommit: true });
        console.log(`✓ Inserted 1 row. Driver: ${mockData.driverName}, Time: ${mockData.lapTimeFormatted}`);

    } catch (err) {
        console.error('Insert failed:', err);
    } finally {
        if (connection) await connection.close();
    }
}

insertMockLap();
