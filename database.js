/**
 * Oracle Database Module for F1 Telemetry
 * Handles database connections and lap time storage
 */

let oracledb;
try {
    oracledb = require('oracledb');
} catch (err) {
    console.log('[Database] oracledb module not available - running in preview mode');
    oracledb = null;
}

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASSWORD || 'Mamarkrknstdaoracle4411!',
    // Use full connection string for thin mode (no wallet needed!)
    connectString: process.env.DB_CONNECT_STRING || '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-singapore-1.oraclecloud.com))(connect_data=(service_name=g4eb1ecbb989e2a_f1test_tpurgent.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))',
    walletLocation: process.env.WALLET_LOCATION || '/home/opc/.oracle/wallets/f1_adb_oci'
};

// Connection pool
let pool = null;

/**
 * Initialize database connection pool
 * Using THIN mode with full connection string (no wallet/thick mode needed!)
 */
async function initialize() {
    if (!oracledb) {
        console.log('[Database] Running in preview mode (oracledb not installed)');
        return false;
    }
    
    try {
        console.log('[Database] Initializing connection pool...');
        console.log('[Database] Using THIN mode (no wallet required)');
        console.log(`[Database] Connecting to: adb.ap-osaka-1.oraclecloud.com`);
        
        // Create connection pool without initOracleClient - use thin mode
        pool = await oracledb.createPool({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString,
            poolMin: 1,
            poolMax: 5,
            poolIncrement: 1
        });
        
        console.log('[Database] ✓ Connection pool created successfully');
        
        // Test connection
        const connection = await pool.getConnection();
        const result = await connection.execute('SELECT 1 AS TEST FROM DUAL');
        await connection.close();
        
        console.log('[Database] ✓ Test query successful:', result.rows[0]);
        return true;
    } catch (err) {
        console.error('[Database] ✗ Failed to initialize:', err.message);
        console.error('[Database] Will continue without database (preview mode only)');
        return false;
    }
}

/**
 * Save lap time to database
 */
async function saveLapTime(lapData) {
    if (!pool) {
        console.log('[Database] Skipping save - no database connection');
        return false;
    }
    
    let connection;
    try {
        connection = await pool.getConnection();
        
        const sql = `INSERT INTO F1_LAP_TIMES (
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
            IS_VALID
        ) VALUES (
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
            :isValid
        )`;
        
        const binds = {
            sessionId: lapData.sessionId || 'UNKNOWN',
            driverName: lapData.driverName || 'Unknown',
            trackName: lapData.trackName || 'Unknown',
            sessionType: lapData.sessionType || 'Unknown',
            lapNumber: lapData.lapNumber || 0,
            lapTimeMs: lapData.lapTimeMs || 0,
            lapTimeFormatted: lapData.lapTimeFormatted || '0:00.000',
            sector1Ms: lapData.sector1Ms || 0,
            sector2Ms: lapData.sector2Ms || 0,
            sector3Ms: lapData.sector3Ms || 0,
            isValid: lapData.isValid !== undefined ? lapData.isValid : 1
        };
        
        const result = await connection.execute(sql, binds, { autoCommit: true });
        
        console.log(`[Database] ✓ Saved Lap ${lapData.lapNumber} - ${lapData.driverName} - ${lapData.lapTimeFormatted} - Valid: ${lapData.isValid ? 'YES' : 'NO'}`);
        return true;
    } catch (err) {
        console.error('[Database] ✗ Error saving lap:', err.message);
        return false;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('[Database] Error closing connection:', err.message);
            }
        }
    }
}

/**
 * Get recent laps from database
 */
async function getRecentLaps(limit = 50) {
    if (!pool) {
        return [];
    }
    
    let connection;
    try {
        connection = await pool.getConnection();
        
        const sql = `SELECT 
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
            IS_VALID,
            CREATED_AT
        FROM F1_LAP_TIMES
        ORDER BY CREATED_AT DESC
        FETCH FIRST :limit ROWS ONLY`;
        
        const result = await connection.execute(sql, { limit }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return result.rows;
    } catch (err) {
        console.error('[Database] Error getting recent laps:', err.message);
        return [];
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('[Database] Error closing connection:', err.message);
            }
        }
    }
}

/**
 * Get laps by session ID
 */
async function getLapsBySession(sessionId) {
    if (!pool) {
        return [];
    }
    
    let connection;
    try {
        connection = await pool.getConnection();
        
        const sql = `SELECT 
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
            IS_VALID,
            CREATED_AT
        FROM F1_LAP_TIMES
        WHERE SESSION_ID = :sessionId
        ORDER BY LAP_NUMBER ASC`;
        
        const result = await connection.execute(sql, { sessionId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return result.rows;
    } catch (err) {
        console.error('[Database] Error getting laps by session:', err.message);
        return [];
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('[Database] Error closing connection:', err.message);
            }
        }
    }
}

/**
 * Close database connection pool
 */
async function close() {
    if (pool) {
        try {
            await pool.close(10);
            console.log('[Database] Connection pool closed');
        } catch (err) {
            console.error('[Database] Error closing pool:', err.message);
        }
    }
}

module.exports = {
    initialize,
    saveLapTime,
    getRecentLaps,
    getLapsBySession,
    close
};

