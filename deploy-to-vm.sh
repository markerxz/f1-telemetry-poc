#!/bin/bash
#
# F1 Telemetry - Complete VM Deployment Script
# Run this on your Oracle Linux 9 VM at 134.185.172.57
#

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   F1 Telemetry - Auto Deployment for Oracle Linux 9   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Update system
echo "📦 Updating system..."
sudo dnf update -y

# Step 2: Install Node.js
echo "📦 Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
fi
echo "✓ Node.js installed: $(node --version)"

# Step 3: Install Git
echo "📦 Installing Git..."
sudo dnf install -y git

# Step 4: Install development tools
echo "📦 Installing development tools..."
sudo dnf groupinstall -y "Development Tools"

# Step 5: Configure firewall
echo "🔥 Configuring firewall..."
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=20777/udp
sudo firewall-cmd --reload
echo "✓ Firewall configured"

# Step 6: Install PM2
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "✓ PM2 installed"

# Step 7: Clone repository
echo "📥 Cloning repository from GitHub..."
cd ~
if [ -d "f1-telemetry-poc" ]; then
    echo "⚠️  Directory exists, pulling latest..."
    cd f1-telemetry-poc
    git pull
else
    git clone https://github.com/markerxz/f1-telemetry-poc.git
    cd f1-telemetry-poc
fi

# Step 8: Install dependencies
echo "📦 Installing npm packages..."
npm install

# Step 9: Start server
echo "🚀 Starting server with PM2..."
pm2 delete f1-telemetry 2>/dev/null || true
pm2 start server-simple.js --name f1-telemetry
pm2 save

# Step 10: Setup PM2 startup
echo "🔧 Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   🎉 DEPLOYMENT COMPLETE!                              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "✓ Server is running!"
echo "✓ Dashboard URL: http://134.185.172.57:3000"
echo ""
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs"
echo ""

