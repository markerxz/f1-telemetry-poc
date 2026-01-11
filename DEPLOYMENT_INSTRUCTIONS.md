# F1 Telemetry - Database Deployment Instructions

## Overview
Complete guide to deploy F1 telemetry with Oracle database integration to your VM.

---

## Step 1: Prepare Database (Already Done!)

The table `F1_LAP_TIMES` already exists in your Oracle database.

**Missing columns to add manually:**
```sql
ALTER TABLE F1_LAP_TIMES ADD (SESSION_ID VARCHAR2(50));
ALTER TABLE F1_LAP_TIMES ADD (DRIVER_NAME VARCHAR2(100));
```

Run these using:
```bash
python C:\Users\Mark\.cursor-tools\oracle_db.py query "ALTER TABLE F1_LAP_TIMES ADD (SESSION_ID VARCHAR2(50))"
python C:\Users\Mark\.cursor-tools\oracle_db.py query "ALTER TABLE F1_LAP_TIMES ADD (DRIVER_NAME VARCHAR2(100))"
```

---

## Step 2: Install Oracle Instant Client on VM

SSH into your VM:
```bash
ssh -i f1telemetry.key opc@140.245.116.86
```

Install Oracle Instant Client:
```bash
# Download and install Oracle Instant Client Basic
cd ~
wget https://download.oracle.com/otn_software/linux/instantclient/2340000/instantclient-basic-linux.x64-23.4.0.24.05.zip
unzip instantclient-basic-linux.x64-23.4.0.24.05.zip
sudo mv instantclient_23_4 /opt/oracle/
sudo sh -c "echo /opt/oracle/instantclient_23_4 > /etc/ld.so.conf.d/oracle-instantclient.conf"
sudo ldconfig

# Set environment variables
echo 'export LD_LIBRARY_PATH=/opt/oracle/instantclient_23_4:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## Step 3: Transfer Oracle Wallet to VM

From your Windows machine:
```bash
scp -i f1telemetry.key -r C:\Users\Mark\.oracle\wallets\f1_adb_oci opc@140.245.116.86:~/.oracle/wallets/
```

---

## Step 4: Deploy Code to VM

The code is already in GitHub, so just pull and install:
```bash
ssh -i f1telemetry.key opc@140.245.116.86

cd ~/f1-telemetry-poc
git pull origin main
npm install
pm2 restart f1-telemetry
pm2 logs f1-telemetry
```

---

## Step 5: Set Environment Variables on VM

Create `.env` file on VM:
```bash
cd ~/f1-telemetry-poc
cat > .env << 'EOF'
DB_USER=ADMIN
DB_PASSWORD=ppPPPP__253fSEDF8675__3fcdvbj
DB_CONNECT_STRING=adbforailowercost_high
WALLET_LOCATION=/home/opc/.oracle/wallets/f1_adb_oci
EOF
```

Update PM2 to use .env:
```bash
pm2 delete f1-telemetry
pm2 start server.js --name f1-telemetry --env production
pm2 save
```

---

## Step 6: Test Database Connection

Check PM2 logs:
```bash
pm2 logs f1-telemetry --lines 50
```

Look for:
- `[Database] ✓ Connection pool created successfully`
- `[Database] ✓ Test query successful`

If you see errors, check:
- Wallet location is correct
- Environment variables are set
- Oracle Instant Client is installed

---

## Step 7: Test Lap Saving

1. Open main dashboard: `http://140.245.116.86:3000`
2. Enter your name
3. Start F1 25 and drive laps
4. Check PM2 logs for: `[Database] ✓ Saved Lap X`

---

## Step 8: View Database Laps

Open lap history page:
```
http://140.245.116.86:3000/lap-history.html
```

You should see:
- All laps from database
- Stats (total laps, valid laps, best lap, drivers)
- Auto-refreshes every 5 seconds

---

## Troubleshooting

### Database connection fails

**Check wallet location:**
```bash
ls -la ~/.oracle/wallets/f1_adb_oci
```

Should contain:
- cwallet.sso
- tnsnames.ora
- sqlnet.ora

**Check environment:**
```bash
echo $LD_LIBRARY_PATH
# Should include /opt/oracle/instantclient_23_4
```

### Laps not saving

**Check logs:**
```bash
pm2 logs f1-telemetry --lines 100
```

Look for database errors.

**Test database manually:**
```bash
cd ~/f1-telemetry-poc
node -e "const db = require('./database'); db.initialize().then(() => console.log('OK'));"
```

### Missing columns error

If you see "invalid identifier" errors for SESSION_ID or DRIVER_NAME, run the ALTER TABLE commands from Step 1.

---

## API Endpoints

Once deployed, these endpoints are available:

- `GET /api/laps/recent` - Get 50 most recent laps
- `GET /api/laps/session/{sessionId}` - Get laps by session ID
- `GET /` - Main dashboard
- `GET /lap-data-preview.html` - Preview page (testing)
- `GET /lap-history.html` - Database lap history

---

## Files Created

- `database.js` - Database module
- `public/lap-history.html` - Database viewer page
- `create_table.sql` - Table creation script
- `DEPLOYMENT_INSTRUCTIONS.md` - This file

---

## Summary

1. ✅ Add missing columns to database table
2. ✅ Install Oracle Instant Client on VM
3. ✅ Transfer wallet to VM
4. ✅ Deploy code (git pull + npm install)
5. ✅ Set environment variables
6. ✅ Restart PM2
7. ✅ Test and verify

**Ready to deploy!** 🚀

