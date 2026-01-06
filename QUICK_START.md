# ⚡ Quick Start Guide

## 🎯 Goal
Get F1 25 telemetry working on OCI Linux VM in 15 minutes.

---

## 📋 What You Have

In your `C:\NoSync\F1` folder:
- ✅ `server.js` - Backend server
- ✅ `public/index.html` - Dashboard
- ✅ `package.json` - Dependencies
- ✅ `setup-vm.sh` - Automated setup script
- ✅ `DEPLOYMENT_GUIDE.md` - Detailed instructions
- ✅ `README.md` - Full documentation

---

## 🚀 Quick Deploy (3 Methods)

### Method 1: Automated Setup (Easiest)

**Step 1:** SSH to your VM

**Ubuntu:**
```bash
ssh -i your-key.key ubuntu@YOUR_VM_IP
```

**Oracle Linux:**
```bash
ssh -i your-key.key opc@YOUR_VM_IP
```

**Step 2:** Download and run setup script

**Ubuntu:**
```bash
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/setup-vm.sh
chmod +x setup-vm.sh
./setup-vm.sh
```

**Oracle Linux 9:**
```bash
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/setup-vm-oracle-linux.sh
chmod +x setup-vm-oracle-linux.sh
./setup-vm-oracle-linux.sh
```

**Step 3:** Upload project files (choose one):

**Option A - Git:**
```bash
git clone https://github.com/YOUR_REPO/f1-telemetry-poc.git
cd f1-telemetry-poc
```

**Option B - SCP (from your Windows PC):**
```powershell
cd C:\NoSync\F1
scp -i path\to\key.key -r * ubuntu@YOUR_VM_IP:~/f1-telemetry-poc/
```

**Step 4:** Install and run
```bash
cd ~/f1-telemetry-poc
npm install
pm2 start server.js --name f1-telemetry
pm2 save
pm2 startup  # Run the command it gives you
```

**Done!** Access: `http://YOUR_VM_IP:3000`

---

### Method 2: Manual Setup (Full Control)

**On Ubuntu VM:**
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Configure firewall
sudo ufw allow 3000/tcp
sudo ufw allow 20777/udp
sudo ufw enable
```

**On Oracle Linux 9 VM:**
```bash
# 1. Update system
sudo dnf update -y

# 2. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git

# 3. Configure firewall
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=20777/udp
sudo firewall-cmd --reload

# 4. Install PM2
sudo npm install -g pm2

# 5. Create directory
mkdir -p ~/f1-telemetry-poc/public
cd ~/f1-telemetry-poc

# 6. Upload files (use SCP or Git)

# 7. Install dependencies
npm install

# 8. Start server
pm2 start server.js --name f1-telemetry
pm2 save
pm2 startup
```

---

### Method 3: Copy-Paste (No Git/SCP)

**On VM:**
```bash
mkdir -p ~/f1-telemetry-poc/public
cd ~/f1-telemetry-poc

# Create server.js
nano server.js
# Paste content from your local server.js, save (Ctrl+X, Y, Enter)

# Create package.json
nano package.json
# Paste content, save

# Create dashboard
nano public/index.html
# Paste content, save

# Install and run
npm install
pm2 start server.js --name f1-telemetry
pm2 save
```

---

## 🎮 Configure F1 25 (When Home)

1. **Game Options → Settings → Telemetry Settings**
2. Set:
   - UDP Telemetry: **ON**
   - UDP IP: **YOUR_VM_PUBLIC_IP**
   - UDP Port: **20777**
   - Send Rate: **60Hz**
3. Start **Time Trial** on **Singapore GP**
4. Drive!

---

## 🌐 Access Dashboard

From any device:
```
http://YOUR_VM_PUBLIC_IP:3000
```

---

## 🔍 Quick Troubleshooting

### Dashboard won't load?
```bash
# Check server status
pm2 status

# Check logs
pm2 logs

# Restart server
pm2 restart all
```

### No telemetry data?
1. Check F1 25 settings (IP correct?)
2. Check OCI Security List (ports 3000 TCP, 20777 UDP open?)
3. Check logs: `pm2 logs`

### Can't SSH?
- Instance running in OCI console?
- Public IP correct?
- SSH key correct?

---

## 📊 What You'll See

**Terminal (VM):**
```
✓ HTTP Server running:    http://0.0.0.0:3000
✓ WebSocket Server ready: ws://0.0.0.0:3000
✓ UDP Listening on:       0.0.0.0:20777

Waiting for F1 25 telemetry data...
```

**Browser Dashboard:**
- Track: Singapore
- Session: Time Trial
- Speed, Gear, RPM (live updates)
- Current lap time
- Last lap time
- Sector times

---

## 🎯 Success Checklist

- [ ] VM created on OCI
- [ ] Ports 3000 (TCP) and 20777 (UDP) open in Security List
- [ ] Node.js installed on VM
- [ ] Project files uploaded
- [ ] Dependencies installed (`npm install`)
- [ ] Server running (`pm2 status` shows "online")
- [ ] Dashboard loads in browser
- [ ] F1 25 configured (when home)
- [ ] Live data flowing

---

## 📞 Useful Commands

```bash
# Server management
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart
pm2 stop all            # Stop

# Check ports
sudo netstat -tulpn | grep 3000
sudo netstat -tulpn | grep 20777

# Check firewall
sudo ufw status

# Get public IP
curl ifconfig.me
```

---

## 🚀 Next Steps After POC

1. Add Oracle Autonomous Database
2. Store lap times and leaderboards
3. Beautiful React dashboard
4. Lap comparison features
5. Oracle branding for demo booth

---

## 📚 Full Documentation

- `README.md` - Complete documentation
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- Server code: `server.js`
- Dashboard: `public/index.html`

---

**Need help?** Check `pm2 logs` for errors!

**Working?** 🎉 You're ready for the demo booth!

