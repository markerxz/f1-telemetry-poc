# F1 25 Telemetry Server - POC

A minimal proof-of-concept telemetry server for F1 25 game that captures UDP telemetry data and displays it in a real-time web dashboard.

## 🎯 Features

- ✅ Captures F1 25 UDP telemetry data
- ✅ Real-time web dashboard with WebSocket
- ✅ Displays:
  - Current and last lap times
  - Sector times
  - Speed, gear, RPM
  - Throttle, brake, steering inputs
  - Track and session information
  - Driver name
- ✅ Works over internet (perfect for OCI deployment)
- ✅ Simple, lightweight, no database required

## 📋 Prerequisites

- Node.js 18+ 
- F1 25 game with telemetry enabled
- Open ports: 3000 (HTTP/WebSocket), 20777 (UDP)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Server

```bash
npm start
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

### 3. Configure F1 25

In F1 25 game:
1. Go to: **Game Options → Settings → Telemetry Settings**
2. Configure:
   - **UDP Telemetry:** ON
   - **UDP IP Address:** `<YOUR_SERVER_IP>` (localhost for local testing, VM IP for remote)
   - **UDP Port:** `20777`
   - **UDP Send Rate:** `60Hz`
   - **UDP Format:** Latest (2024)

### 4. Open Dashboard

Open in any browser:
```
http://<YOUR_SERVER_IP>:3000
```

For local testing: `http://localhost:3000`

## 🌐 Deployment to OCI (Oracle Cloud)

### 1. Create OCI Compute Instance

- **Shape:** VM.Standard.E2.1.Micro (Free Tier) or VM.Standard.A1.Flex
- **Image:** Ubuntu 22.04
- **Network:** Public subnet with public IP

### 2. Configure Security Rules

**In OCI Console (Security List):**
- Add Ingress Rule:
  - **Port:** 3000
  - **Protocol:** TCP
  - **Source:** 0.0.0.0/0
- Add Ingress Rule:
  - **Port:** 20777
  - **Protocol:** UDP
  - **Source:** 0.0.0.0/0

**On the VM (Ubuntu Firewall):**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 20777/udp
sudo ufw enable
```

### 3. Install Node.js on VM

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Upload Project Files

**Option A: Using Git (Recommended)**
```bash
# On your local machine, push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main

# On OCI VM
git clone <your-repo-url>
cd f1-telemetry-poc
npm install
```

**Option B: Using SCP**
```bash
# From your local machine
scp -r -i <your-ssh-key> . ubuntu@<VM_IP>:~/f1-telemetry-poc/
```

**Option C: Manual Copy-Paste**
```bash
# On VM, create files manually
mkdir -p ~/f1-telemetry-poc/public
cd ~/f1-telemetry-poc

# Create each file and paste contents
nano server.js
nano public/index.html
nano package.json
```

### 5. Run Server on VM

**For testing:**
```bash
npm start
```

**For production (keeps running after logout):**
```bash
# Install PM2
sudo npm install -g pm2

# Start server with PM2
pm2 start server.js --name f1-telemetry

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it provides
```

**PM2 Commands:**
```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart all     # Restart server
pm2 stop all        # Stop server
```

### 6. Access Dashboard

From any device:
```
http://<YOUR_VM_PUBLIC_IP>:3000
```

### 7. Configure F1 25 to Connect to OCI

On your gaming PC, in F1 25:
- **UDP IP Address:** `<YOUR_VM_PUBLIC_IP>`
- **UDP Port:** `20777`

## 🔍 Troubleshooting

### No data appearing in dashboard

1. **Check server is running:**
   ```bash
   pm2 status
   # or
   pm2 logs
   ```

2. **Check firewall on VM:**
   ```bash
   sudo ufw status
   ```
   Should show ports 3000 and 20777 as ALLOW

3. **Check OCI Security List:**
   - Verify ingress rules for ports 3000 (TCP) and 20777 (UDP)

4. **Test UDP connectivity:**
   ```bash
   # On VM, check if port is listening
   sudo netstat -ulnp | grep 20777
   ```

5. **Check F1 25 settings:**
   - Verify IP address is correct
   - Verify UDP is enabled
   - Try restarting the game

### Dashboard shows "Disconnected"

1. **Check WebSocket connection:**
   - Open browser console (F12)
   - Look for WebSocket errors

2. **Check server logs:**
   ```bash
   pm2 logs f1-telemetry
   ```

3. **Try accessing via REST API:**
   ```
   http://<VM_IP>:3000/api/data
   ```

### Can't access dashboard from browser

1. **Check server is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Check from external network:**
   ```bash
   curl http://<VM_PUBLIC_IP>:3000
   ```

3. **Verify firewall rules** (both OCI and VM)

## 📊 Data Flow

```
F1 25 Game (Gaming PC)
    ↓ UDP packets to VM_IP:20777
OCI Compute Instance (Linux VM)
    ├─ Node.js server receives UDP
    ├─ Parses telemetry data
    ├─ Broadcasts via WebSocket
    └─ Serves HTML dashboard
        ↓
Browser (Any device)
    └─ http://VM_IP:3000
```

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Run with auto-reload
npm run dev

# Configure F1 25 to send to localhost
# UDP IP: 127.0.0.1
```

### Project Structure

```
f1-telemetry-poc/
├── server.js              # Main server (UDP + WebSocket + HTTP)
├── public/
│   └── index.html         # Dashboard frontend
├── package.json           # Dependencies
├── .env.example           # Configuration template
└── README.md              # This file
```

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
HTTP_PORT=3000      # HTTP/WebSocket port
UDP_PORT=20777      # F1 telemetry UDP port
HOST=0.0.0.0        # Listen on all interfaces
NODE_ENV=production
```

## 🔐 Security Notes

For production/demo booth:
- Consider adding authentication to dashboard
- Restrict source IPs in OCI Security List
- Use HTTPS/WSS with reverse proxy (nginx)
- Don't expose to public internet unnecessarily

## 📚 Resources

- [F1 Telemetry Documentation](https://forums.codemasters.com/topic/80231-f1-2021-udp-specification/)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Node.js Documentation](https://nodejs.org/)

## 🎮 F1 25 Track IDs

Singapore GP = Track ID 12

## 📄 License

MIT

## 🤝 Support

For issues or questions, check the logs:
```bash
pm2 logs f1-telemetry
```

## 🚀 Next Steps

After POC is working:
- Add Oracle Autonomous Database integration
- Store lap times and leaderboards
- Create beautiful React dashboard
- Add lap comparison features
- Deploy multiple instances for multi-player support

