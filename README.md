# 🏎️ F1 25 Real-Time Telemetry Dashboard

Real-time telemetry dashboard for F1 25 game, hosted on Oracle Cloud Infrastructure.

## Features

- 🎮 **Real-time telemetry** from F1 25 game via UDP
- 📊 **Live dashboard** with speed, throttle, brake, steering, RPM, gear
- ⏱️ **Lap times** with sector splits
- 🌍 **Track detection** (Singapore GP and all F1 tracks)
- ☁️ **Cloud-hosted** on Oracle Linux 9
- 📱 **Accessible** from any device on your network

## Quick Start

### 1. Configure F1 25 Game

In F1 25, go to **Settings → Telemetry Settings**:
- **UDP Telemetry**: ON
- **UDP IP Address**: `140.245.116.86` (your VM IP)
- **UDP Port**: `20777`
- **UDP Format**: `2025`

### 2. Deploy to Oracle Cloud VM

SSH into your VM:

```bash
ssh -i your-key.key opc@140.245.116.86
```

Clone and deploy:

```bash
cd ~
git clone https://github.com/markerxz/f1-telemetry-poc.git
cd f1-telemetry-poc
npm install
pm2 start server.js --name f1-telemetry
pm2 save
```

### 3. Access Dashboard

Open in your browser:

```
http://140.245.116.86:3000
```

## Update Deployment

To update the server with latest code:

```bash
cd ~/f1-telemetry-poc
git pull
pm2 restart f1-telemetry
```

## CLI Inspector

To view decoded telemetry directly in SSH terminal:

```bash
node cli-inspector.js
```

Press `Ctrl+C` to stop.

## Architecture

- **Backend**: Node.js with UDP socket for F1 25 telemetry
- **Frontend**: HTML/CSS/JavaScript with WebSocket for real-time updates
- **Protocol**: F1 25 UDP Telemetry (Official EA Spec)
- **Hosting**: Oracle Linux 9 on OCI Compute

## Files

- `server.js` - Main telemetry server (UDP + WebSocket + HTTP)
- `public/index.html` - Dashboard UI
- `cli-inspector.js` - CLI tool for debugging telemetry
- `deploy-to-vm.sh` - Automated deployment script
- `package.json` - Node.js dependencies

## Troubleshooting

### Dashboard not loading

Check if server is running:

```bash
pm2 status
pm2 logs f1-telemetry
```

### Port already in use

Kill all Node processes and restart:

```bash
pm2 delete f1-telemetry
sudo pkill -9 node
pm2 start server.js --name f1-telemetry
pm2 save
```

### No telemetry data

1. Check F1 25 telemetry settings (IP, port, format)
2. Verify firewall rules (port 20777 UDP, port 3000 TCP)
3. Use `node cli-inspector.js` to verify data reception

## License

MIT

## Credits

Built for F1 25 demo booth using Oracle Cloud Infrastructure.
