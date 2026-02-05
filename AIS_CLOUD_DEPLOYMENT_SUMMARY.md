# ✅ AIS Cloud Deployment - COMPLETE

## Deployment Summary
**Date**: January 13, 2026  
**Status**: ✅ **SUCCESSFULLY DEPLOYED**

---

## Your New Environment Configuration

### **Database (AIS Cloud Thailand)**
- **Database Name**: `f1data`
- **Region**: `ap-pathumthani-1` (AIS Cloud Thailand)
- **Host**: `adb.ap-pathumthani-1.thaiaiscloud.com`
- **Connection**: TLS/SSL (port 1522)
- **TNS Alias**: `f1data_tpurgent`
- **Username**: `ADMIN`
- **Password**: `<HIDDEN>`
- **Wallet Location (VM)**: `/home/opc/.oracle/wallets/f1data_wallet`
- **Table**: `F1_LAP_TIMES` ✅ Created with indexes

### **VM (AIS Cloud)**
- **Public IP**: `134.185.172.57`
- **SSH Key**: `C:\NoSync\F1\f1telemetry.key`
- **SSH Username**: `opc`
- **Hostname**: `f1telemetry`

### **Application**
- **Web Dashboard**: `http://134.185.172.57:3000`
- **Lap History**: `http://134.185.172.57:3000/lap-history.html`
- **UDP Telemetry Port**: `20777`
- **Status**: ✅ Running with PM2
- **Database**: ✅ Connected and tested

---

## What Was Deployed

### ✅ Configuration Files Updated
1. **database.js** - Updated for AIS Cloud f1data database
2. **ecosystem.config.js** - PM2 configuration with new credentials
3. **package.json** - Updated dependencies

### ✅ Database Setup
1. Created `F1_LAP_TIMES` table with all required columns
2. Created indexes for performance:
   - `idx_lap_times_session_id`
   - `idx_lap_times_driver`
   - `idx_lap_times_track`

### ✅ VM Deployment
1. Wallet files transferred to VM
2. Code deployed via Git (push/pull)
3. Dependencies installed (`npm install`)
4. PM2 restarted with new configuration

---

## Access Your Application

### **Main Dashboard**
```
http://134.185.172.57:3000
```
Enter your driver name and start F1 25!

### **Lap History (Database Viewer)**
```
http://134.185.172.57:3000/lap-history.html
```
View all laps stored in the database with statistics.

### **API Endpoints**
- `GET /api/laps/recent` - Get 50 most recent laps
- `GET /api/laps/session/{sessionId}` - Get laps by session

---

## F1 Game Configuration

To send telemetry from F1 25 to your server:

1. Open F1 25 game
2. Go to **Settings** → **Telemetry Settings**
3. Configure:
   - **UDP Telemetry**: ON
   - **UDP IP Address**: `134.185.172.57`
   - **UDP Port**: `20777`
   - **UDP Send Rate**: 60Hz (recommended)
4. Start a session and drive!

---

## Monitoring & Management

### **SSH to VM**
```powershell
ssh -i f1telemetry.key opc@134.185.172.57
```

### **PM2 Commands**
```bash
pm2 status                    # Check app status
pm2 logs f1-telemetry         # View live logs
pm2 restart f1-telemetry      # Restart app
pm2 stop f1-telemetry         # Stop app
pm2 start f1-telemetry        # Start app
```

### **Update Code**
```bash
cd ~/f1-telemetry-poc
git pull                      # Pull latest changes
npm install                   # Install dependencies
pm2 restart f1-telemetry      # Restart app
```

---

## Verification Checklist

✅ Database connection successful  
✅ Test query executed successfully  
✅ F1_LAP_TIMES table created  
✅ Indexes created  
✅ Wallet transferred to VM  
✅ Application running on PM2  
✅ Web server accessible on port 3000  
✅ UDP server listening on port 20777  

---

## Next Steps

1. **Test the application**:
   - Open `http://134.185.172.57:3000` in your browser
   - Enter your driver name
   - Start F1 25 and configure telemetry settings
   - Drive some laps!

2. **View your laps**:
   - Check `http://134.185.172.57:3000/lap-history.html`
   - See real-time statistics and lap times

3. **Monitor the system**:
   - SSH to VM and check PM2 logs
   - Watch for lap data being saved to database

---

## Troubleshooting

### If laps aren't saving:
```bash
ssh -i f1telemetry.key opc@134.185.172.57
pm2 logs f1-telemetry --lines 50
```
Look for database errors or connection issues.

### If web page doesn't load:
```bash
ssh -i f1telemetry.key opc@134.185.172.57
pm2 status
```
Ensure app is "online".

### If game telemetry not received:
- Verify game settings (IP: `134.185.172.57`, Port: `20777`)
- Check firewall allows UDP port 20777
- Check PM2 logs for UDP packet reception

---

## Files & Locations

### **Local (Windows)**
- Wallet: `C:\NoSync\F1\Wallet_f1data\`
- SSH Key: `C:\NoSync\F1\f1telemetry.key`
- Project: `C:\NoSync\F1\`

### **VM (Linux)**
- Wallet: `/home/opc/.oracle/wallets/f1data_wallet/`
- Project: `/home/opc/f1-telemetry-poc/`
- PM2 Logs: `/home/opc/.pm2/logs/`

---

## GitHub Repository
```
https://github.com/markerxz/f1-telemetry-poc
```

All configuration is now in Git. To deploy updates:
1. Make changes locally
2. `git add`, `git commit`, `git push`
3. SSH to VM: `cd ~/f1-telemetry-poc && git pull && pm2 restart f1-telemetry`

---

## 🏎️ Ready to Race!

Your F1 telemetry system is now fully deployed on AIS Cloud Thailand with:
- ✅ Oracle Autonomous Database (TLS encrypted)
- ✅ VM with public IP
- ✅ Real-time telemetry capture
- ✅ Database persistence
- ✅ Web dashboard

**Start F1 25 and enjoy your telemetry system!** 🏁
