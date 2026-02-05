/**
 * Create F1_LAP_TIMES table in AIS Cloud f1data database
 */

const oracledb = require('oracledb');

async function createTable() {
    let connection;
    try {
        console.log('=== Creating F1_LAP_TIMES Table ===');
        console.log('');

        // Set wallet location
        process.env.TNS_ADMIN = 'C:\\NoSync\\F1\\Wallet_f1data';

        console.log('Connecting to database...');
        connection = await oracledb.getConnection({
            user: 'ADMIN',
            password: 'Mamarkrknstda4411!',
            connectString: 'f1data_tpurgent'
        });

        console.log('✓ Connected');
        console.log('');

        // Create table
        console.log('Creating F1_LAP_TIMES table...');
        const createTableSQL = `
            CREATE TABLE F1_LAP_TIMES (
                LAP_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                SESSION_ID VARCHAR2(50),
                DRIVER_NAME VARCHAR2(100),
                SESSION_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                TRACK_NAME VARCHAR2(100),
                SESSION_TYPE VARCHAR2(50),
                LAP_NUMBER NUMBER,
                LAP_TIME_MS NUMBER,
                LAP_TIME_FORMATTED VARCHAR2(20),
                SECTOR1_MS NUMBER,
                SECTOR2_MS NUMBER,
                SECTOR3_MS NUMBER,
                IS_VALID NUMBER(1) DEFAULT 1,
                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await connection.execute(createTableSQL);
        await connection.commit();
        console.log('✓ Table created successfully');
        console.log('');

        // Create indexes
        console.log('Creating indexes...');

        await connection.execute('CREATE INDEX idx_lap_times_session_id ON F1_LAP_TIMES(SESSION_ID)');
        console.log('✓ Created index: idx_lap_times_session_id');

        await connection.execute('CREATE INDEX idx_lap_times_driver ON F1_LAP_TIMES(DRIVER_NAME)');
        console.log('✓ Created index: idx_lap_times_driver');

        await connection.execute('CREATE INDEX idx_lap_times_track ON F1_LAP_TIMES(TRACK_NAME)');
        console.log('✓ Created index: idx_lap_times_track');

        await connection.commit();
        console.log('');
        console.log('=== Table Creation Complete ===');
        console.log('✓ F1_LAP_TIMES table is ready!');

    } catch (err) {
        console.error('');
        console.error('=== Table Creation FAILED ===');
        console.error('Error:', err.message);

        if (err.message.includes('ORA-00955')) {
            console.error('');
            console.error('Note: Table already exists. This is OK!');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

createTable();
