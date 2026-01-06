# 🧪 Test Your VM Connection

Use this mock sender to test if your VM can receive F1 telemetry data!

---

## 🚀 Quick Test (2 Steps)

### **Step 1: Run Mock Sender on Your PC**

Open PowerShell in `C:\NoSync\F1`:

```powershell
node test-sender.js 140.245.116.86
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║     F1 Telemetry Mock Sender - Test Tool              ║
╚════════════════════════════════════════════════════════╝

Target VM:  140.245.116.86:20777
Send Rate:  60 packets/second

Simulating F1 25 telemetry...
Press Ctrl+C to stop

[READY] Sending mock telemetry packets...

[9:30:15 AM] Sent 60 packets (229 bytes each)
[9:30:16 AM] Sent 120 packets (229 bytes each)
[9:30:17 AM] Sent 180 packets (229 bytes each)
```

### **Step 2: Check Dashboard**

Open browser:
```
http://140.245.116.86:3000
```

**If working, you'll see:**
- ✅ Status changes to **"Connected - Receiving Data!"** (Green)
- ✅ **Packets Received** counter going up
- ✅ **Last Packet** shows current time

---

## 📋 What the Mock Sender Does

✅ Sends realistic F1 25 UDP packets (same structure as real game)
✅ Includes packet headers (format, version, session ID)
✅ Sends 3 types of packets:
  - **Telemetry** (speed, throttle, brake, gear, RPM)
  - **Lap Data** (lap times, sectors)
  - **Session** (track ID, session type)
✅ Sends at 60Hz (same as F1 25)
✅ Packet size ~229 bytes (realistic)

---

## 🔧 Usage Options

### **Default (uses saved VM IP):**
```powershell
node test-sender.js
```

### **Custom VM IP:**
```powershell
node test-sender.js YOUR_VM_IP
```

### **Stop Sending:**
Press `Ctrl+C`

---

## ✅ Expected Results

### **On Your PC (sender):**
```
[READY] Sending mock telemetry packets...

[9:30:15 AM] Sent 60 packets (229 bytes each)
[9:30:16 AM] Sent 120 packets (229 bytes each)
[9:30:17 AM] Sent 180 packets (229 bytes each)
...
```

### **On Dashboard (browser):**
```
Status: Connected - Receiving Data! 🟢
Packets Received: 1,234
Last Packet: 9:30:18 AM
```

### **On VM (SSH logs):**
```bash
pm2 logs
```
Should show:
```
[UDP] Packet received from YOUR_PC_IP:XXXX | Size: 229 bytes | Total: 123
[UDP] Packet received from YOUR_PC_IP:XXXX | Size: 229 bytes | Total: 124
```

---

## 🧪 Troubleshooting

### **Problem: No packets received on VM**

**Check 1: Firewall on VM**
```bash
# On VM via SSH
sudo firewall-cmd --list-ports
# Should show: 20777/udp
```

**Check 2: OCI Security List**
- Go to OCI Console
- Compute → Instances → Your Instance
- Subnet → Security Lists
- Verify Ingress Rule: Port 20777/UDP from 0.0.0.0/0

**Check 3: VM Server Running**
```bash
pm2 status
# Should show: f1-telemetry | online
```

**Check 4: Your PC Firewall**
- Windows Firewall might block outbound UDP
- Temporarily disable to test

---

### **Problem: Sender shows errors**

**Error: "EACCES: permission denied"**
```powershell
# Run PowerShell as Administrator
```

**Error: "ENETUNREACH: network unreachable"**
- Check VM IP is correct
- Check your internet connection
- Try ping first: `ping 140.245.116.86`

---

### **Problem: Dashboard doesn't update**

1. **Hard refresh browser:** `Ctrl+Shift+R`
2. **Check WebSocket:** Should show "Connected" in Server Info
3. **Check browser console:** Press F12, look for errors

---

## 🎯 What This Proves

If the test works:
- ✅ Your PC can send UDP to VM over internet
- ✅ OCI firewall is configured correctly
- ✅ VM firewall is configured correctly
- ✅ Server is receiving and processing packets
- ✅ WebSocket is streaming to dashboard
- ✅ **Everything is ready for real F1 25!**

---

## 📊 Packet Structure

The mock sender creates realistic F1 25 packets:

### **Packet Header (29 bytes):**
```
Packet Format:      2024 (uint16)
Game Year:          25 (uint8)
Packet Version:     1 (uint8)
Packet ID:          1-6 (uint8)
Session UID:        12345678 (uint64)
Session Time:       123.456 (float)
Frame ID:           current timestamp (uint32)
Player Index:       0 (uint8)
```

### **Telemetry Data (~100 bytes):**
```
Speed:              150-250 km/h (uint16)
Throttle:           0.8-1.0 (float)
Brake:              0.0-0.2 (float)
Steering:           -0.15 to 0.15 (float)
Gear:               4-7 (uint8)
RPM:                10000-13000 (uint16)
DRS:                0 or 1 (uint8)
```

### **Lap Data (~150 bytes):**
```
Last Lap Time:      92345 ms (1:32.345)
Current Lap Time:   10000-90000 ms
Sector 1:           28500 ms
Sector 2:           32800 ms
Lap Number:         5
```

Same structure as real F1 25!

---

## 🔄 Workflow

1. **Test with mock sender** (this tool) ✅
2. **Verify VM receives data** ✅
3. **Once working, connect real F1 25** 🎮
4. **Enjoy live telemetry!** 🏎️

---

## 💡 Tips

- **Leave mock sender running** while checking dashboard
- **Watch packet counter** increment in real-time
- **Check PM2 logs** to see packets arriving
- **Stop sender** with Ctrl+C when done testing
- **Mock data is random** - simulates driving

---

## 🎮 Next Step: Real F1 25

Once mock sender works, configure F1 25:
```
Game Options → Settings → Telemetry Settings
UDP IP: 140.245.116.86
UDP Port: 20777
Send Rate: 60Hz
```

**Same packets, real data!** 🏁

