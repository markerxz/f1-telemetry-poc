# ✅ Session Name Feature Added + Driver Name Fixed

## Changes Made

### 1. **Added Session Name Input Field** 📝
- New input field in the telemetry dashboard
- Located next to the Driver Name field
- Placeholder: "e.g. Practice, Qualifying, Race"
- Stored in localStorage (persists across sessions)

### 2. **Fixed Driver Name Handling** 🔧
- Driver name now properly defaults to "Unknown" if not provided
- WebSocket sends driver info immediately on connection
- Both driver name and session name are sent together
- Console logging added for debugging

### 3. **Updated Server** 🖥️
- Server now receives `sessionName` from client
- Stores it as `sessionType` in the database
- Logs: `[Session] Driver: {name}, Session: {session}, ID: {id}`

## How It Works

### **On the Dashboard (index.html):**

1. **Driver Name Input:**
   ```html
   <input id="driverName" placeholder="Enter your name">
   ```

2. **Session Name Input (NEW):**
   ```html
   <input id="sessionName" placeholder="e.g. Practice, Qualifying, Race">
   ```

3. **JavaScript Handling:**
   - Both fields save to `localStorage`
   - On change, sends WebSocket message:
     ```javascript
     {
       type: 'setDriver',
       driverName: 'Your Name',
       sessionName: 'Practice',
       sessionId: 'SESSION_...'
     }
     ```

### **On the Server (server.js):**

Receives the message and updates:
```javascript
latestData.driverName = data.driverName || 'Unknown';
latestData.sessionType = data.sessionName || 'Unknown';
latestData.sessionId = data.sessionId;
```

### **In the Database:**

When a lap is saved:
```javascript
{
  driverName: 'Your Name',        // From driver input
  sessionType: 'Practice',        // From session input
  sessionId: 'SESSION_...',       // Auto-generated
  trackName: 'Singapore',
  lapNumber: 1,
  lapTimeMs: 90525,
  ...
}
```

## Usage Instructions

### **For Users:**

1. **Open the dashboard:** http://134.185.172.57:3000

2. **Enter your information:**
   - **Driver Name**: Your name (e.g., "Mark")
   - **Session Name**: What you're doing (e.g., "Practice", "Qualifying", "Race", "Time Trial")

3. **Start F1 25** and configure telemetry:
   - UDP IP: `134.185.172.57`
   - UDP Port: `20777`

4. **Drive laps** - They'll be saved with your driver name and session name!

5. **View results:** http://134.185.172.57:3000/lap-history.html

## Database Schema

The `SESSION_TYPE` column now stores the custom session name you enter:

| Column | Example Value | Source |
|--------|---------------|--------|
| DRIVER_NAME | "Mark" | Driver Name input |
| SESSION_TYPE | "Practice" | Session Name input |
| SESSION_ID | "SESSION_1768..." | Auto-generated |
| TRACK_NAME | "Singapore" | From game telemetry |
| LAP_TIME_MS | 90525 | From game telemetry |

## Testing

### **Test the Fix:**

1. Open http://134.185.172.57:3000
2. Enter Driver Name: "Test Driver"
3. Enter Session Name: "Test Session"
4. Open browser console (F12)
5. Look for: `Sent driver info: { driverName: "Test Driver", sessionName: "Test Session", sessionId: "..." }`

### **Verify on Server:**

```bash
ssh -i f1telemetry.key opc@134.185.172.57
pm2 logs f1-telemetry --lines 20
```

Look for:
```
[Session] Driver: Test Driver, Session: Test Session, ID: SESSION_...
```

## Benefits

✅ **Custom Session Names** - Organize your laps by practice, qualifying, race, etc.  
✅ **Driver Name Fixed** - No more "Unknown" drivers  
✅ **Persistent** - Names saved in browser localStorage  
✅ **Real-time** - Sent immediately when you type  
✅ **Database Ready** - All laps tagged with your session name  

## Example Use Cases

1. **Practice Sessions:**
   - Driver: "Mark"
   - Session: "Practice - Setup Testing"

2. **Qualifying:**
   - Driver: "Mark"
   - Session: "Qualifying - Singapore GP"

3. **Race:**
   - Driver: "Mark"
   - Session: "Race - 50% Distance"

4. **Time Trial:**
   - Driver: "Mark"
   - Session: "Time Trial - Hotlap Challenge"

## Files Changed

- ✅ `public/index.html` - Added session name input + fixed JavaScript
- ✅ `server.js` - Updated WebSocket handler to receive sessionName
- ✅ Deployed to VM and restarted PM2

## 🎉 Ready to Use!

Your F1 telemetry system now supports custom session names and properly handles driver names!

**Dashboard:** http://134.185.172.57:3000  
**Lap History:** http://134.185.172.57:3000/lap-history.html
