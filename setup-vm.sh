#!/bin/bash

###############################################################################
# F1 Telemetry Server - VM Setup Script
# 
# This script automates the setup process on a fresh Ubuntu VM
# Run this on your OCI Ubuntu instance
###############################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════╗"
echo "║   F1 Telemetry Server - Automated Setup               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as ubuntu user."
    exit 1
fi

# Step 1: Update system
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Step 2: Install Node.js
print_info "Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Step 3: Install Git
print_info "Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    print_success "Git installed"
else
    print_success "Git already installed"
fi

# Step 4: Configure firewall
print_info "Configuring Ubuntu firewall..."
sudo ufw allow 3000/tcp
sudo ufw allow 20777/udp
sudo ufw --force enable
print_success "Firewall configured"

# Step 5: Install PM2
print_info "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Step 6: Create project directory
print_info "Creating project directory..."
mkdir -p ~/f1-telemetry-poc/public
cd ~/f1-telemetry-poc
print_success "Project directory created"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Setup Complete!                                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Upload your project files to: ~/f1-telemetry-poc/"
echo ""
echo "   Option A - Using Git:"
echo "     git clone https://github.com/YOUR_USERNAME/f1-telemetry-poc.git"
echo ""
echo "   Option B - Using SCP from your local machine:"
echo "     scp -i your-key.key -r * ubuntu@$(curl -s ifconfig.me):~/f1-telemetry-poc/"
echo ""
echo "2. Install dependencies:"
echo "     cd ~/f1-telemetry-poc"
echo "     npm install"
echo ""
echo "3. Start the server:"
echo "     pm2 start server.js --name f1-telemetry"
echo "     pm2 save"
echo "     pm2 startup"
echo ""
echo "4. Access dashboard:"
echo "     http://$(curl -s ifconfig.me):3000"
echo ""
print_success "Your VM public IP: $(curl -s ifconfig.me)"
echo ""

