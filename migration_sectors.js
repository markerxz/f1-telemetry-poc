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

        console.log('Connected. Starting migration...');

        // 1. Add Columns
        const columns = ['SECTOR1_FORMATTED', 'SECTOR2_FORMATTED', 'SECTOR3_FORMATTED'];
        for (const col of columns) {
            try {
                await connection.execute(`ALTER TABLE F1_LAP_TIMES ADD (${col} VARCHAR2(20))`);
                console.log(`Added column ${col}`);
            } catch (err) {
                if (err.message.includes('ORA-01430')) {
                    console.log(`Column ${col} already exists.`);
                } else {
                    throw err;
                }
            }
        }

        // 2. Backfill Data
        console.log('Backfilling data for existing laps...');
        // Oracle SQL to format MS to mm:ss.ms
        // Note: Handling case where MS is 0 or null -> '0:00.000' or similar if desired, but here we just update valid ones.
        const formatSql = `
            UPDATE F1_LAP_TIMES SET
            SECTOR1_FORMATTED = CASE WHEN SECTOR1_MS > 0 THEN 
                FLOOR(SECTOR1_MS/60000) || ':' || LPAD(FLOOR(MOD(SECTOR1_MS,60000)/1000),2,'0') || '.' || LPAD(MOD(SECTOR1_MS,1000),3,'0')
                ELSE '0:00.000' END,
            SECTOR2_FORMATTED = CASE WHEN SECTOR2_MS > 0 THEN
                FLOOR(SECTOR2_MS/60000) || ':' || LPAD(FLOOR(MOD(SECTOR2_MS,60000)/1000),2,'0') || '.' || LPAD(MOD(SECTOR2_MS,1000),3,'0')
                ELSE '0:00.000' END,
            SECTOR3_FORMATTED = CASE WHEN SECTOR3_MS > 0 THEN
                FLOOR(SECTOR3_MS/60000) || ':' || LPAD(FLOOR(MOD(SECTOR3_MS,60000)/1000),2,'0') || '.' || LPAD(MOD(SECTOR3_MS,1000),3,'0')
                ELSE '0:00.000' END
            WHERE SECTOR1_FORMATTED IS NULL OR SECTOR2_FORMATTED IS NULL
        `;

        const result = await connection.execute(formatSql, {}, { autoCommit: true });
        console.log(`Updated ${result.rowsAffected} rows.`);

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
