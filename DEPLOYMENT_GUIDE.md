# 🚀 Deployment Guide - OCI Linux VM Setup

This guide will help you deploy the F1 telemetry server to Oracle Cloud Infrastructure (OCI) Linux VM.

---

## 📋 Prerequisites Checklist

- [ ] Oracle Cloud account
- [ ] OCI Compute instance created (or will create)
- [ ] SSH key for accessing VM
- [ ] Project files ready (created in workspace)

---

## Part 1: Create OCI Compute Instance

### Step 1: Log into Oracle Cloud

1. Go to: https://cloud.oracle.com
2. Sign in to your account
3. Navigate to: **Compute → Instances**

### Step 2: Create Instance

Click **Create Instance** and configure:

**Name:** `f1-telemetry-server`

**Placement:**
- Availability Domain: (any)
- Fault Domain: (any)

**Image and Shape:**

**Option A: Free Tier (x86)**
- Image: **Ubuntu 22.04**
- Shape: **VM.Standard.E2.1.Micro** (Always Free)
  - 1 OCPU
  - 1 GB RAM

**Option B: Free Tier (ARM - Better Performance)**
- Image: **Ubuntu 22.04**
- Shape: **VM.Standard.A1.Flex** (Always Free)
  - 2 OCPU
  - 12 GB RAM
  - (You can use up to 4 OCPU + 24GB total free)

**Networking:**
- VCN: Create new or use existing
- Subnet: **Public subnet**
- **✅ Assign a public IPv4 address** (IMPORTANT!)

**Add SSH Keys:**
- Upload your SSH public key OR generate new key pair
- **Download private key** if generating new (you'll need this!)

**Boot Volume:**
- 50 GB (default is fine)

Click **Create**

### Step 3: Wait for Instance to Start

- Status will change from "Provisioning" to "Running"
- Note down the **Public IP Address** (e.g., 132.145.xxx.xxx)

---

## Part 2: Configure Network Security

### Step 1: Configure Security List (OCI Firewall)

1. On instance details page, click the **Subnet** link
2. Click **Security Lists** → Click your security list
3. Click **Add Ingress Rules**

**Rule 1: HTTP/WebSocket Dashboard**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: **TCP**
- Destination Port Range: `3000`
- Description: `F1 Dashboard`
- Click **Add Ingress Rules**

**Rule 2: UDP Telemetry**
- Click **Add Ingress Rules** again
- Source CIDR: `0.0.0.0/0`
- IP Protocol: **UDP**
- Destination Port Range: `20777`
- Description: `F1 Telemetry UDP`
- Click **Add Ingress Rules**

### Step 2: Connect to VM via SSH

**On Windows (PowerShell):**
```powershell
ssh -i path\to\your\private-key.key ubuntu@YOUR_VM_PUBLIC_IP
```

**Example:**
```powershell
ssh -i C:\Users\Mark\Downloads\ssh-key.key ubuntu@132.145.xxx.xxx
```

**First time connecting:**
- Type `yes` when asked about fingerprint

You should see:
```
Welcome to Ubuntu 22.04 LTS
ubuntu@f1-telemetry-server:~$
```

---

## Part 3: Install Node.js on VM

Run these commands **on the VM** (after SSH):

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
# Should show: v20.x.x

npm --version
# Should show: 10.x.x
```

---

## Part 4: Upload Project Files to VM

You have **3 options** to upload files:

### **Option A: Using Git (Recommended)**

**On your local Windows machine:**
```powershell
cd C:\NoSync\F1

# Initialize git (if not already)
git init

# Add files
git add .

# Commit
git commit -m "F1 telemetry POC"

# Create GitHub repo and push
# (Follow GitHub instructions to create repo)
git remote add origin https://github.com/YOUR_USERNAME/f1-telemetry-poc.git
git push -u origin main
```

**On the OCI VM:**
```bash
# Install git
sudo apt install git -y

# Clone your repository
git clone https://github.com/YOUR_USERNAME/f1-telemetry-poc.git

# Enter directory
cd f1-telemetry-poc
```

---

### **Option B: Using SCP (Direct Upload)**

**On your local Windows machine (PowerShell):**
```powershell
# Navigate to project folder
cd C:\NoSync\F1

# Upload entire folder to VM
scp -i path\to\your\private-key.key -r * ubuntu@YOUR_VM_IP:~/f1-telemetry-poc/
```

**Example:**
```powershell
scp -i C:\Users\Mark\Downloads\ssh-key.key -r * ubuntu@132.145.50.100:~/f1-telemetry-poc/
```

**On the OCI VM:**
```bash
cd ~/f1-telemetry-poc
ls -la
# You should see all your files
```

---

### **Option C: Manual Copy-Paste (Slowest but Works)**

**On the OCI VM:**
```bash
# Create project directory
mkdir -p ~/f1-telemetry-poc/public
cd ~/f1-telemetry-poc

# Create server.js
nano server.js
# Paste the contents from your local server.js
# Press Ctrl+X, then Y, then Enter to save

# Create package.json
nano package.json
# Paste contents, save

# Create index.html
nano public/index.html
# Paste contents, save

# Create .env
nano .env
# Paste:
HTTP_PORT=3000
UDP_PORT=20777
HOST=0.0.0.0
NODE_ENV=production
# Save
```

---

## Part 5: Install Dependencies and Run

**On the OCI VM:**

```bash
# Make sure you're in project directory
cd ~/f1-telemetry-poc

# Install dependencies
npm install

# This will install:
# - @racehub-io/f1-telemetry-client
# - ws (WebSocket)
```

---

## Part 6: Configure Ubuntu Firewall

**On the OCI VM:**

```bash
# Allow ports
sudo ufw allow 3000/tcp
sudo ufw allow 20777/udp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status

# Should show:
# 3000/tcp    ALLOW       Anywhere
# 20777/udp   ALLOW       Anywhere
```

---

## Part 7: Test the Server

### Test 1: Start Server Manually

**On the OCI VM:**
```bash
cd ~/f1-telemetry-poc
node server.js
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║     F1 25 Telemetry Server - POC                       ║
╚════════════════════════════════════════════════════════╝

✓ HTTP Server running:    http://0.0.0.0:3000
✓ WebSocket Server ready: ws://0.0.0.0:3000
✓ UDP Listening on:       0.0.0.0:20777

Waiting for F1 25 telemetry data...
```

### Test 2: Access Dashboard from Browser

**On your laptop/phone browser:**
```
http://YOUR_VM_PUBLIC_IP:3000
```

**Example:**
```
http://132.145.50.100:3000
```

You should see the F1 Telemetry Dashboard!
- Status will show "Waiting for data..." (normal, F1 not connected yet)

### Test 3: Check if Ports are Open

**From your local machine:**
```powershell
# Test HTTP port
Test-NetConnection -ComputerName YOUR_VM_IP -Port 3000

# Should show: TcpTestSucceeded : True
```

---

## Part 8: Run Server Permanently (PM2)

Right now, if you close SSH, the server stops. Let's fix that with PM2.

**On the OCI VM:**

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start server with PM2
pm2 start server.js --name f1-telemetry

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# It will show a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Copy and run that command

# Verify it's running
pm2 status

# You should see:
# ┌─────┬──────────────┬─────────┬─────────┐
# │ id  │ name         │ status  │ restart │
# ├─────┼──────────────┼─────────┼─────────┤
# │ 0   │ f1-telemetry │ online  │ 0       │
# └─────┴──────────────┴─────────┴─────────┘
```

**PM2 Commands (useful):**
```bash
pm2 status          # Check status
pm2 logs            # View live logs
pm2 logs --lines 50 # View last 50 lines
pm2 restart all     # Restart server
pm2 stop all        # Stop server
pm2 delete all      # Remove from PM2
```

Now you can **close SSH** and the server keeps running! ✅

---

## Part 9: Test Everything

### Checklist:

- [ ] SSH to VM works
- [ ] Node.js installed (`node --version`)
- [ ] Project files uploaded
- [ ] `npm install` completed successfully
- [ ] Server starts without errors
- [ ] Dashboard accessible from browser
- [ ] Ports 3000 and 20777 open in OCI Security List
- [ ] Ubuntu firewall configured
- [ ] PM2 running server
- [ ] Server survives SSH disconnect

---

## Part 10: When You Get Home - Connect F1 25

**On your gaming PC (when you're home):**

1. Start F1 25
2. Go to: **Game Options → Settings → Telemetry Settings**
3. Configure:
   - **UDP Telemetry:** ON
   - **UDP IP Address:** `YOUR_VM_PUBLIC_IP` (e.g., 132.145.50.100)
   - **UDP Port:** `20777`
   - **UDP Send Rate:** `60Hz`
   - **UDP Format:** 2024 (latest)
4. Save and exit to main menu
5. Start **Time Trial** on **Singapore GP**
6. Drive!

**On your laptop browser:**
```
http://YOUR_VM_PUBLIC_IP:3000
```

You should see **LIVE DATA** updating! 🎉

---

## 🔍 Troubleshooting

### Problem: Can't SSH to VM

**Check:**
- Is instance "Running" in OCI console?
- Is public IP correct?
- Is SSH key correct?
- Try: `ssh -v -i key.key ubuntu@IP` (verbose mode)

### Problem: Can't access dashboard (port 3000)

**Check:**
1. Server running?
   ```bash
   pm2 status
   ```

2. Port open in OCI Security List?
   - Go to OCI Console → Instance → Subnet → Security List
   - Check ingress rule for port 3000 TCP

3. Ubuntu firewall?
   ```bash
   sudo ufw status
   ```

4. Test locally on VM:
   ```bash
   curl http://localhost:3000
   ```

### Problem: No telemetry data

**Check:**
1. F1 25 telemetry settings correct?
2. VM IP address correct in F1 25?
3. Port 20777 UDP open in OCI Security List?
4. Check server logs:
   ```bash
   pm2 logs f1-telemetry
   ```

### Problem: npm install fails

**Try:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Install again
npm install
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Your Home Network                              │
│                                                  │
│  ┌────────────────┐                             │
│  │  Gaming PC     │                             │
│  │  F1 25 Game    │                             │
│  └────────┬───────┘                             │
│           │ UDP Telemetry                       │
└───────────┼─────────────────────────────────────┘
            │
            │ Internet
            │
┌───────────▼─────────────────────────────────────┐
│  Oracle Cloud Infrastructure                    │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Compute Instance (Ubuntu)               │   │
│  │  Public IP: 132.145.x.x                  │   │
│  │                                           │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │  Node.js Server (PM2)              │  │   │
│  │  │  ├─ UDP Listener :20777            │  │   │
│  │  │  ├─ WebSocket Server :3000         │  │   │
│  │  │  └─ HTTP Server :3000              │  │   │
│  │  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
└───────────┬─────────────────────────────────────┘
            │
            │ HTTP/WebSocket
            │
┌───────────▼─────────────────────────────────────┐
│  Any Device with Browser                        │
│  ┌────────────────────────────────────────┐     │
│  │  http://132.145.x.x:3000               │     │
│  │  F1 Telemetry Dashboard                │     │
│  └────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

---

## 🎉 Success Criteria

You'll know it's working when:

✅ Dashboard loads in browser
✅ Shows "Connected - Receiving telemetry"
✅ Speed updates in real-time
✅ Lap times recorded
✅ Track shows "Singapore"
✅ All telemetry data flowing

---

## 📝 Quick Reference

**VM Access:**
```bash
ssh -i your-key.key ubuntu@YOUR_VM_IP
```

**Check Server:**
```bash
pm2 status
pm2 logs
```

**Restart Server:**
```bash
pm2 restart f1-telemetry
```

**Dashboard URL:**
```
http://YOUR_VM_PUBLIC_IP:3000
```

**F1 25 Settings:**
- IP: YOUR_VM_PUBLIC_IP
- Port: 20777
- Rate: 60Hz

---

## 🚀 Next Steps After POC Works

1. ✅ Add Oracle Autonomous Database
2. ✅ Store lap times and leaderboards
3. ✅ Create beautiful React dashboard
4. ✅ Add lap comparison features
5. ✅ Oracle branding

---

Good luck! 🏎️💨

