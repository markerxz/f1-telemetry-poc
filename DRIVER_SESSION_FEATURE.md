# Driver Name and Session ID Feature

## Overview
Added driver name input and session ID tracking to identify who drove which laps in the database.

---

## What's New

### 1. **Driver Name Input (Main Dashboard)**
- Added a driver name input field in the top bar of the main dashboard
- Driver name is saved in browser localStorage (persists across sessions)
- Automatically sends driver name to server when changed

**Location:** Top right of the main dashboard  
**URL:** `http://140.245.116.86:3000`

### 2. **Session ID Generation**
- Unique session ID generated when page loads
- Format: `SESSION_[timestamp]_[random]`
- Example: `SESSION_1736655123456_abc123def`
- Displayed below the driver name input

### 3. **Database Schema Updates**

**New Fields Added to `F1_LAP_TIMES` table:**

| Field | Type | Description |
|-------|------|-------------|
| `SESSION_ID` | VARCHAR2(50) | Unique session identifier (UUID) |
| `DRIVER_NAME` | VARCHAR2(100) | Name of the driver |

**New Indexes:**
```sql
CREATE INDEX idx_lap_times_session_id ON F1_LAP_TIMES(SESSION_ID);
CREATE INDEX idx_lap_times_driver ON F1_LAP_TIMES(DRIVER_NAME);
```

---

## How It Works

### User Flow:

1. **User opens main dashboard** → Session ID is auto-generated
2. **User enters their name** → Name is saved and sent to server
3. **User drives laps** → Each lap is tagged with driver name and session ID
4. **Data is captured** → Preview page shows driver name for each lap
5. **SQL statements include** → SESSION_ID and DRIVER_NAME fields

### Example SQL Statement:

```sql
INSERT INTO F1_LAP_TIMES (
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
    'SESSION_1736655123456_abc123def',
    'John Smith',
    CURRENT_TIMESTAMP,
    'Singapore',
    'Time Trial',
    1,
    102567,
    '1:42.567',
    32123,
    35234,
    35210,
    1
);
```

---

## Features

### Main Dashboard (`index.html`)

**Driver Name Input:**
- Text input field in top bar
- Placeholder: "Enter your name"
- Max length: 50 characters
- Saves to localStorage automatically
- Green border matching F1 theme

**Session ID Display:**
- Shows truncated session ID
- Format: "Session: SESSION_173665..."
- Helps identify current session

### Preview Page (`lap-data-preview.html`)

**Status Bar:**
- Added "Driver" field showing current driver name
- Updates in real-time from telemetry data

**Lap History Table:**
- Added "Driver" column
- Shows driver name for each captured lap
- Included in SQL export

**SQL Preview:**
- Shows SESSION_ID and DRIVER_NAME in INSERT statement
- Updated schema documentation

---

## Usage Examples

### Scenario 1: Single Driver, Multiple Sessions

**Session 1 (Morning):**
- Driver: "Mark"
- Session ID: SESSION_1736655123456_abc123def
- Laps: 5 laps at Singapore

**Session 2 (Afternoon):**
- Driver: "Mark"
- Session ID: SESSION_1736658234567_xyz789ghi
- Laps: 3 laps at Monaco

**Database Query:**
```sql
SELECT DRIVER_NAME, COUNT(*) as TOTAL_LAPS, AVG(LAP_TIME_MS) as AVG_TIME
FROM F1_LAP_TIMES
WHERE DRIVER_NAME = 'Mark'
GROUP BY DRIVER_NAME;
```

### Scenario 2: Multiple Drivers, Same Track

**Driver 1:**
- Name: "John"
- Session: SESSION_1736655123456_abc123def
- Best Lap: 1:42.567

**Driver 2:**
- Name: "Sarah"
- Session: SESSION_1736655234567_def456ghi
- Best Lap: 1:41.234

**Database Query:**
```sql
SELECT 
    DRIVER_NAME,
    MIN(LAP_TIME_MS) as BEST_LAP_MS,
    MIN(LAP_TIME_FORMATTED) as BEST_LAP_TIME
FROM F1_LAP_TIMES
WHERE TRACK_NAME = 'Singapore'
GROUP BY DRIVER_NAME
ORDER BY MIN(LAP_TIME_MS) ASC;
```

### Scenario 3: Leaderboard by Session

```sql
SELECT 
    SESSION_ID,
    DRIVER_NAME,
    TRACK_NAME,
    MIN(LAP_TIME_MS) as BEST_LAP,
    COUNT(*) as TOTAL_LAPS,
    SESSION_TIMESTAMP
FROM F1_LAP_TIMES
GROUP BY SESSION_ID, DRIVER_NAME, TRACK_NAME, SESSION_TIMESTAMP
ORDER BY MIN(LAP_TIME_MS) ASC;
```

---

## Updated CREATE TABLE Statement

```sql
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

CREATE INDEX idx_lap_times_track ON F1_LAP_TIMES(TRACK_NAME);
CREATE INDEX idx_lap_times_session ON F1_LAP_TIMES(SESSION_TIMESTAMP);
CREATE INDEX idx_lap_times_session_id ON F1_LAP_TIMES(SESSION_ID);
CREATE INDEX idx_lap_times_driver ON F1_LAP_TIMES(DRIVER_NAME);
```

---

## Technical Details

### Session ID Generation (Client-Side)

```javascript
function generateSessionId() {
    return 'SESSION_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
```

**Components:**
- Prefix: `SESSION_`
- Timestamp: `Date.now()` (milliseconds since epoch)
- Random: 9-character random string (base36)

### Driver Name Storage

**LocalStorage:**
- Key: `f1_driver_name`
- Value: User-entered name
- Persists across browser sessions
- Auto-loads on page refresh

### WebSocket Communication

**Client → Server:**
```javascript
{
    type: 'setDriver',
    driverName: 'John Smith',
    sessionId: 'SESSION_1736655123456_abc123def'
}
```

**Server Storage:**
```javascript
latestData.driverName = 'John Smith';
latestData.sessionId = 'SESSION_1736655123456_abc123def';
latestData.sessionStartTime = '2026-01-12T10:30:00.000Z';
```

---

## Benefits

### 1. **Multi-User Support**
- Track multiple drivers using the same system
- Compare lap times between drivers
- Identify who set which records

### 2. **Session Tracking**
- Group laps by session
- Track improvement over time
- Analyze performance trends

### 3. **Data Analysis**
- Query by driver name
- Filter by session
- Generate leaderboards
- Track personal bests

### 4. **Event Management**
- Perfect for demo booths
- Multiple people can try
- Each gets their own records
- Easy to identify best performers

---

## Testing

### Test the Feature:

1. **Open main dashboard:**
   ```
   http://140.245.116.86:3000
   ```

2. **Enter your name** in the "Driver Name" field

3. **Note the Session ID** displayed below

4. **Drive some laps** in F1 25

5. **Open preview page:**
   ```
   http://140.245.116.86:3000/lap-data-preview.html
   ```

6. **Verify:**
   - ✅ Driver name shows in status bar
   - ✅ Driver name appears in lap history table
   - ✅ SQL statements include SESSION_ID and DRIVER_NAME
   - ✅ Export includes driver info

---

## Future Enhancements

Possible additions:
- Driver profile pictures
- Driver statistics dashboard
- Multi-driver leaderboards
- Session replay feature
- Driver comparison charts
- Team/group tracking
- Achievement badges
- Social sharing

---

## Files Modified

1. `public/index.html` - Added driver input and session tracking
2. `server.js` - Added session/driver data handling
3. `public/lap-data-preview.html` - Added driver display and SQL updates
4. `DATABASE_SETUP.md` - Updated schema documentation

---

## Summary

✅ Driver name input added to main dashboard  
✅ Session ID auto-generated and tracked  
✅ Database schema updated with new fields  
✅ Preview page shows driver info  
✅ SQL statements include driver and session data  
✅ All changes deployed to VM  

**Ready to test!** 🏁

