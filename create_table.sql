-- F1 Lap Times Table Creation Script
-- Run this using: python C:\Users\Mark\.cursor-tools\oracle_db.py query "@create_table.sql"

-- Drop table if exists (optional - uncomment if you want to recreate)
-- DROP TABLE F1_LAP_TIMES;

-- Create main table
CREATE TABLE F1_LAP_TIMES (
    LAP_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    SESSION_ID VARCHAR2(50),
    DRIVER_NAME VARCHAR2(100),
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

-- Create indexes for better query performance
CREATE INDEX idx_lap_times_track ON F1_LAP_TIMES(TRACK_NAME);
CREATE INDEX idx_lap_times_session ON F1_LAP_TIMES(SESSION_TIMESTAMP);
CREATE INDEX idx_lap_times_session_id ON F1_LAP_TIMES(SESSION_ID);
CREATE INDEX idx_lap_times_driver ON F1_LAP_TIMES(DRIVER_NAME);

-- Verify table creation
SELECT 'Table created successfully!' as STATUS FROM DUAL;

