# F1 Telemetry - Database Setup Guide

## Overview
This document contains all the SQL scripts needed to set up the Oracle database for storing F1 lap time data.

## Database Schema

### Table: F1_LAP_TIMES
Stores lap time data captured from F1 25 telemetry.

```sql
CREATE TABLE F1_LAP_TIMES (
    LAP_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    SESSION_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TRACK_NAME VARCHAR2(50),
    SESSION_TYPE VARCHAR2(20),
    LAP_NUMBER NUMBER,
    LAP_TIME_MS NUMBER,
    LAP_TIME_FORMATTED VARCHAR2(20),
    SECTOR1_MS NUMBER,
    SECTOR2_MS NUMBER,
    SECTOR3_MS NUMBER,
    IS_VALID NUMBER(1) DEFAULT 1,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `LAP_ID` | NUMBER | Auto-generated primary key |
| `SESSION_TIMESTAMP` | TIMESTAMP | When the session started |
| `TRACK_NAME` | VARCHAR2(50) | Track name (e.g., "Singapore", "Monaco") |
| `SESSION_TYPE` | VARCHAR2(20) | Session type (e.g., "Time Trial", "Race", "Q3") |
| `LAP_NUMBER` | NUMBER | Lap number in the session |
| `LAP_TIME_MS` | NUMBER | Total lap time in milliseconds |
| `LAP_TIME_FORMATTED` | VARCHAR2(20) | Human-readable format (e.g., "1:42.567") |
| `SECTOR1_MS` | NUMBER | Sector 1 time in milliseconds |
| `SECTOR2_MS` | NUMBER | Sector 2 time in milliseconds |
| `SECTOR3_MS` | NUMBER | Sector 3 time in milliseconds |
| `IS_VALID` | NUMBER(1) | 1 = valid lap, 0 = invalid lap |
| `CREATED_AT` | TIMESTAMP | When the record was inserted |

### Indexes

```sql
CREATE INDEX idx_lap_times_track ON F1_LAP_TIMES(TRACK_NAME);
CREATE INDEX idx_lap_times_session ON F1_LAP_TIMES(SESSION_TIMESTAMP);
```

## Setup Instructions

### Step 1: Create the Table

Using the Oracle DB tool:
```bash
python C:\Users\Mark\.cursor-tools\oracle_db.py query "CREATE TABLE F1_LAP_TIMES (LAP_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, SESSION_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, TRACK_NAME VARCHAR2(50), SESSION_TYPE VARCHAR2(20), LAP_NUMBER NUMBER, LAP_TIME_MS NUMBER, LAP_TIME_FORMATTED VARCHAR2(20), SECTOR1_MS NUMBER, SECTOR2_MS NUMBER, SECTOR3_MS NUMBER, IS_VALID NUMBER(1) DEFAULT 1, CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
```

### Step 2: Create Indexes

```bash
python C:\Users\Mark\.cursor-tools\oracle_db.py query "CREATE INDEX idx_lap_times_track ON F1_LAP_TIMES(TRACK_NAME)"

python C:\Users\Mark\.cursor-tools\oracle_db.py query "CREATE INDEX idx_lap_times_session ON F1_LAP_TIMES(SESSION_TIMESTAMP)"
```

### Step 3: Verify Table Creation

```bash
python C:\Users\Mark\.cursor-tools\oracle_db.py desc F1_LAP_TIMES
```

## Sample Queries

### Get all laps for a specific track
```sql
SELECT * FROM F1_LAP_TIMES 
WHERE TRACK_NAME = 'Singapore' 
ORDER BY LAP_TIME_MS ASC;
```

### Get best lap time for each track
```sql
SELECT 
    TRACK_NAME,
    MIN(LAP_TIME_MS) as BEST_LAP_MS,
    MIN(LAP_TIME_FORMATTED) as BEST_LAP_TIME
FROM F1_LAP_TIMES
WHERE IS_VALID = 1
GROUP BY TRACK_NAME
ORDER BY TRACK_NAME;
```

### Get recent session data
```sql
SELECT * FROM F1_LAP_TIMES
WHERE SESSION_TIMESTAMP >= SYSDATE - 1
ORDER BY CREATED_AT DESC;
```

### Get lap count by track
```sql
SELECT 
    TRACK_NAME,
    COUNT(*) as TOTAL_LAPS,
    AVG(LAP_TIME_MS) as AVG_LAP_TIME_MS
FROM F1_LAP_TIMES
WHERE IS_VALID = 1
GROUP BY TRACK_NAME
ORDER BY TOTAL_LAPS DESC;
```

### Get sector analysis for best lap
```sql
SELECT 
    TRACK_NAME,
    LAP_TIME_FORMATTED,
    SECTOR1_MS,
    SECTOR2_MS,
    SECTOR3_MS,
    CREATED_AT
FROM F1_LAP_TIMES
WHERE LAP_TIME_MS = (
    SELECT MIN(LAP_TIME_MS) 
    FROM F1_LAP_TIMES 
    WHERE TRACK_NAME = 'Singapore' AND IS_VALID = 1
);
```

## Testing Before Database Setup

Before creating the database table, you can test the data capture using the preview page:

1. Start the F1 telemetry server:
   ```bash
   node server.js
   ```

2. Open the preview page:
   ```
   http://localhost:3000/lap-data-preview.html
   ```

3. Start F1 25 and enable telemetry (Settings > Telemetry > UDP Telemetry: ON, Port: 20777)

4. Drive some laps and verify:
   - Data is being captured correctly
   - SQL statements look correct
   - All fields have proper values

5. Export the SQL statements to review them

## Data Validation

The preview page will show you:
- ✅ Real-time lap data as it's captured
- ✅ Exact SQL INSERT statements that will be executed
- ✅ All captured laps in a table format
- ✅ Ability to export SQL for manual review

## Cleanup (if needed)

### Drop the table
```sql
DROP TABLE F1_LAP_TIMES;
```

### Truncate all data
```sql
TRUNCATE TABLE F1_LAP_TIMES;
```

### Delete specific session
```sql
DELETE FROM F1_LAP_TIMES 
WHERE SESSION_TIMESTAMP = TO_TIMESTAMP('2026-01-12 10:30:00', 'YYYY-MM-DD HH24:MI:SS');
```

## Next Steps

After testing with the preview page and confirming the data looks correct:

1. Run the CREATE TABLE statement
2. Update `server.js` to enable database writes
3. Deploy to VM with Oracle Instant Client
4. Start capturing real lap data!

