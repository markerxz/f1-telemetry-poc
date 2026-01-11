# F1 Telemetry - Testing Guide

## Quick Start: Test Data Capture Before Database Setup

Follow these steps to test the lap data capture and review what will be stored in the database.

---

## Step 1: Start the Telemetry Server

Open a terminal in the F1 project directory and run:

```bash
node server.js
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║   F1 25 Telemetry Server - FULL PARSING               ║
╚════════════════════════════════════════════════════════╝

✓ Dashboard:  http://0.0.0.0:3000
✓ UDP Server: 0.0.0.0:20777

Waiting for F1 25 telemetry...
```

---

## Step 2: Open the Preview Page

Open your web browser and navigate to:

```
http://localhost:3000/lap-data-preview.html
```

You should see:
- 🏎️ **F1 Lap Data Preview** page
- Status showing "DISCONNECTED" (normal, waiting for F1 game)
- Empty lap history table
- Database schema documentation

---

## Step 3: Configure F1 25 Telemetry

1. Launch **F1 25** game
2. Go to **Settings** → **Telemetry Settings**
3. Set the following:
   - **UDP Telemetry:** ON
   - **UDP Port:** 20777
   - **UDP Format:** 2025
   - **UDP Send Rate:** 60Hz (or higher)
4. Save settings

---

## Step 4: Drive Some Laps

1. Start a **Time Trial** session (recommended for testing)
2. Choose any track (Singapore recommended as it's in the code)
3. Drive at least 2-3 complete laps
4. Keep the preview page open in your browser

---

## Step 5: Monitor the Preview Page

As you drive, you should see:

### ✅ Real-Time Updates
- **Telemetry Status:** Changes to "CONNECTED" (green, pulsing)
- **Track:** Shows current track name
- **Session:** Shows session type (e.g., "Time Trial")
- **Current Lap Data:** Updates live as you drive

### ✅ Completed Laps
After completing each lap, the page will:
- Increment "Laps Captured" counter
- Add a row to the "Captured Laps" table
- Update the SQL INSERT statement preview
- Highlight the best lap with 🏆

### ✅ SQL Preview
The SQL panel shows the exact INSERT statement that will be executed:
```sql
INSERT INTO F1_LAP_TIMES (
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

## Step 6: Review the Data

Check the following in the preview page:

### Data Validation Checklist

- [ ] **Track Name** is correct (e.g., "Singapore", "Monaco")
- [ ] **Session Type** is correct (e.g., "Time Trial")
- [ ] **Lap Numbers** are sequential (1, 2, 3, ...)
- [ ] **Lap Times** look reasonable (e.g., 1:30.000 - 2:00.000 for most tracks)
- [ ] **Sector Times** add up to approximately the total lap time
- [ ] **Sector Times** are all positive numbers (not 0 or negative)
- [ ] **SQL Statements** have proper syntax
- [ ] **Best Lap** is highlighted with 🏆

### Common Issues to Check

❌ **If Sector Times are 0:**
- This is normal for the first lap (sectors not completed yet)
- Sector 3 is calculated from total lap time minus sector 1 and 2

❌ **If Track Name shows "Unknown":**
- The track might not be in the track name mapping
- This is fine, it will still be stored

❌ **If Times Look Too Large:**
- Times are in milliseconds (e.g., 102567 ms = 1:42.567)
- This is correct!

---

## Step 7: Export SQL for Review

1. Click the **"📄 Export SQL Statements"** button
2. A file will download: `f1_lap_times_[timestamp].sql`
3. Open the file in a text editor
4. Review all the SQL INSERT statements

Example exported file:
```sql
-- F1 Lap Times SQL Export
-- Generated: 2026-01-12T10:30:00.000Z
-- Total Laps: 3

INSERT INTO F1_LAP_TIMES (SESSION_TIMESTAMP, TRACK_NAME, SESSION_TYPE, LAP_NUMBER, LAP_TIME_MS, LAP_TIME_FORMATTED, SECTOR1_MS, SECTOR2_MS, SECTOR3_MS, IS_VALID) VALUES (CURRENT_TIMESTAMP, 'Singapore', 'Time Trial', 1, 102567, '1:42.567', 32123, 35234, 35210, 1);
INSERT INTO F1_LAP_TIMES (SESSION_TIMESTAMP, TRACK_NAME, SESSION_TYPE, LAP_NUMBER, LAP_TIME_MS, LAP_TIME_FORMATTED, SECTOR1_MS, SECTOR2_MS, SECTOR3_MS, IS_VALID) VALUES (CURRENT_TIMESTAMP, 'Singapore', 'Time Trial', 2, 101234, '1:41.234', 31890, 34567, 34777, 1);
INSERT INTO F1_LAP_TIMES (SESSION_TIMESTAMP, TRACK_NAME, SESSION_TYPE, LAP_NUMBER, LAP_TIME_MS, LAP_TIME_FORMATTED, SECTOR1_MS, SECTOR2_MS, SECTOR3_MS, IS_VALID) VALUES (CURRENT_TIMESTAMP, 'Singapore', 'Time Trial', 3, 100987, '1:40.987', 31567, 34234, 35186, 1);
```

---

## Step 8: Decision Time

### ✅ If Everything Looks Good:

**Proceed to database setup!**

1. Review `DATABASE_SETUP.md` for SQL scripts
2. Run the CREATE TABLE statement using the Oracle DB tool
3. Enable database writes in the server code
4. Deploy to VM

### ❌ If Something Looks Wrong:

**Let me know what's wrong and I'll fix it:**

- Incorrect data values?
- Missing fields?
- SQL syntax issues?
- Timing problems?

---

## Additional Testing Tips

### Test Different Scenarios

1. **Different Tracks:** Try Monaco, Silverstone, Monza
2. **Different Sessions:** Time Trial, Practice, Qualifying
3. **Invalid Laps:** Cut corners and see if data is still captured
4. **Multiple Sessions:** Stop and restart F1 25

### Clear History Between Tests

Click **"🗑️ Clear History"** to reset the captured laps and test again.

### Check the Main Dashboard

The main dashboard at `http://localhost:3000` should still work normally while the preview page is open.

---

## Troubleshooting

### Preview Page Shows "DISCONNECTED"

**Check:**
- Is `server.js` running?
- Is F1 25 running with telemetry enabled?
- Is the UDP port set to 20777 in F1 25 settings?
- Try refreshing the preview page

### No Laps Being Captured

**Check:**
- Are you completing full laps? (crossing start/finish line)
- Check the browser console for errors (F12 → Console)
- Check the server terminal for errors

### WebSocket Connection Failed

**Check:**
- Is the server running on port 3000?
- Try accessing `http://localhost:3000` first
- Check if another application is using port 3000

---

## Next Steps

Once you've verified the data looks correct:

1. ✅ Confirm all data fields are correct
2. ✅ Confirm SQL statements are valid
3. ✅ Review `DATABASE_SETUP.md`
4. ✅ Create the database table
5. ✅ Deploy to VM with database integration

---

## Questions?

If anything looks wrong or you need adjustments:
- Check what data is incorrect
- Export the SQL and review it
- Let me know what needs to be changed

**Ready to proceed with database setup when you are!** 🏁

