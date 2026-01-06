# 🚀 Deploy to Your VM Right Now!

Your VM IP: **134.185.172.57**
Your GitHub: https://github.com/markerxz/f1-telemetry-poc ✅

---

## 📝 Simple 3-Step Deployment

### **Step 1: SSH to Your VM**

Open **PowerShell** and run:

```powershell
ssh -i C:\NoSync\F1\f1telemetry.key opc@134.185.172.57
```

**First time connecting?** Type `yes` when asked about fingerprint.

---

### **Step 2: Run This One Command**

Once connected to the VM, **copy and paste this entire command**:

```bash
curl -sSL https://raw.githubusercontent.com/markerxz/f1-telemetry-poc/main/deploy-to-vm.sh | bash
```

This will automatically:
- ✅ Update system
- ✅ Install Node.js
- ✅ Install Git
- ✅ Configure firewall
- ✅ Clone your GitHub repo
- ✅ Install dependencies
- ✅ Start the server

**It takes about 5-10 minutes.** Just wait for it to complete.

---

### **Step 3: Test the Dashboard**

Open your browser:

```
http://134.185.172.57:3000
```

You should see the F1 Telemetry Dashboard! 🎉

Status will show: **"Waiting for data..."** (normal until you connect F1 25)

---

## 🔍 Alternative: Manual Step-by-Step

If the automated script doesn't work, run these commands **one by one** on the VM:

```bash
# 1. Update system
sudo dnf update -y

# 2. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git

# 3. Install dev tools
sudo dnf groupinstall -y "Development Tools"

# 4. Configure firewall
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=20777/udp
sudo firewall-cmd --reload

# 5. Install PM2
sudo npm install -g pm2

# 6. Clone repository
cd ~
git clone https://github.com/markerxz/f1-telemetry-poc.git
cd f1-telemetry-poc

# 7. Install dependencies
npm install

# 8. Start server
pm2 start server.js --name f1-telemetry
pm2 save
pm2 startup
```

---

## ✅ Verify Everything Works

### Check Server Status:
```bash
pm2 status
```

Should show:
```
┌─────┬──────────────┬─────────┬─────────┐
│ id  │ name         │ status  │ restart │
├─────┼──────────────┼─────────┼─────────┤
│ 0   │ f1-telemetry │ online  │ 0       │
└─────┴──────────────┴─────────┴─────────┘
```

### View Logs:
```bash
pm2 logs f1-telemetry
```

Should see:
```
✓ HTTP Server running:    http://0.0.0.0:3000
✓ WebSocket Server ready: ws://0.0.0.0:3000
✓ UDP Listening on:       0.0.0.0:20777
```

### Check Firewall:
```bash
sudo firewall-cmd --list-ports
```

Should show: `3000/tcp 20777/udp`

---

## 🎮 When You Get Home: Configure F1 25

1. Open F1 25
2. **Game Options → Settings → Telemetry Settings**
3. Configure:
   - **UDP Telemetry:** ON
   - **UDP IP Address:** `134.185.172.57`
   - **UDP Port:** `20777`
   - **UDP Send Rate:** `60Hz`
4. Start **Time Trial** on **Singapore GP**
5. Open dashboard: `http://134.185.172.57:3000`
6. **See live data!** 🏎️💨

---

## 🔧 Useful Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart server
pm2 restart f1-telemetry

# Stop server
pm2 stop f1-telemetry

# Check if ports are open
sudo ss -tulpn | grep -E '3000|20777'

# Check firewall
sudo firewall-cmd --list-all
```

---

## 🆘 Troubleshooting

### Can't SSH to VM?
- Check VM is running in OCI console
- Verify key file path: `C:\NoSync\F1\f1telemetry.key`
- Try: `ssh -v -i C:\NoSync\F1\f1telemetry.key opc@134.185.172.57`

### Dashboard won't load?
```bash
# On VM, check server
pm2 status
pm2 logs

# Check firewall
sudo firewall-cmd --list-ports
```

### Need to update code?
```bash
# On VM
cd ~/f1-telemetry-poc
git pull
npm install
pm2 restart f1-telemetry
```

---

## 🎯 Success Checklist

- [ ] Can SSH to VM
- [ ] Node.js installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Server running (pm2 status shows "online")
- [ ] Dashboard loads in browser
- [ ] Firewall configured
- [ ] Ready for F1 25 connection!

---

## 🎉 You're Done!

Your F1 telemetry server is now running on Oracle Cloud!

**Dashboard:** http://134.185.172.57:3000

**Next:** Connect F1 25 when you get home! 🏁


