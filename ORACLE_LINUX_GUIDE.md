# 🚀 Oracle Linux 9 Deployment Guide

## Key Differences from Ubuntu

Oracle Linux 9 uses:
- **Package Manager:** `dnf` (instead of `apt`)
- **Firewall:** `firewalld` (instead of `ufw`)
- **Default User:** `opc` (instead of `ubuntu`)

---

## ⚡ Quick Setup for Oracle Linux 9

### Step 1: SSH to Your VM

```bash
ssh -i your-key.key opc@YOUR_VM_PUBLIC_IP
```

**Note:** Default user is `opc`, not `ubuntu`!

### Step 2: Run Automated Setup

**Option A: Download and run the script**
```bash
# Download the Oracle Linux setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/setup-vm-oracle-linux.sh

# Make it executable
chmod +x setup-vm-oracle-linux.sh

# Run it
./setup-vm-oracle-linux.sh
```

**Option B: Manual commands (if script doesn't work)**
```bash
# Update system
sudo dnf update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Install Git
sudo dnf install -y git

# Install development tools
sudo dnf groupinstall -y "Development Tools"

# Configure firewall
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=20777/udp
sudo firewall-cmd --reload

# Install PM2
sudo npm install -g pm2

# Create project directory
mkdir -p ~/f1-telemetry-poc/public
cd ~/f1-telemetry-poc
```

### Step 3: Upload Project Files

**Method A: Using Git**
```bash
git clone https://github.com/YOUR_USERNAME/f1-telemetry-poc.git
cd f1-telemetry-poc
```

**Method B: Using SCP (from Windows PC)**
```powershell
cd C:\NoSync\F1
scp -i path\to\key.key -r * opc@YOUR_VM_IP:~/f1-telemetry-poc/
```

### Step 4: Install Dependencies and Run

```bash
cd ~/f1-telemetry-poc

# Install npm packages
npm install

# Start server with PM2
pm2 start server.js --name f1-telemetry

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it provides
```

---

## 🔥 Firewall Configuration (firewalld)

### Check Firewall Status
```bash
sudo firewall-cmd --state
```

### List Open Ports
```bash
sudo firewall-cmd --list-all
```

### Open Required Ports
```bash
# Open HTTP/WebSocket port (3000)
sudo firewall-cmd --permanent --add-port=3000/tcp

# Open UDP telemetry port (20777)
sudo firewall-cmd --permanent --add-port=20777/udp

# Reload firewall
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-ports
# Should show: 3000/tcp 20777/udp
```

### Close Ports (if needed)
```bash
sudo firewall-cmd --permanent --remove-port=3000/tcp
sudo firewall-cmd --permanent --remove-port=20777/udp
sudo firewall-cmd --reload
```

---

## 🔍 Troubleshooting Oracle Linux 9

### Check if Ports are Listening

```bash
# Check TCP port 3000
sudo ss -tlnp | grep 3000

# Check UDP port 20777
sudo ss -ulnp | grep 20777
```

### Check SELinux (Oracle Linux security)

Oracle Linux 9 has SELinux enabled by default, which might block some connections.

**Check SELinux status:**
```bash
getenforce
# Should show: Enforcing, Permissive, or Disabled
```

**If having connection issues, temporarily set to permissive:**
```bash
sudo setenforce 0
# Test if it works now

# Check logs
sudo ausearch -m avc -ts recent
```

**To permanently disable SELinux (not recommended for production):**
```bash
sudo nano /etc/selinux/config
# Change SELINUX=enforcing to SELINUX=permissive
# Reboot required
```

**Better: Add SELinux policy for your ports (recommended):**
```bash
# Allow Node.js to bind to ports
sudo semanage port -a -t http_port_t -p tcp 3000
sudo semanage port -a -t unreserved_port_t -p udp 20777
```

### Check System Logs

```bash
# View system logs
sudo journalctl -xe

# View PM2 logs
pm2 logs

# View firewall logs
sudo journalctl -u firewalld
```

### Node.js Installation Issues

If Node.js installation fails:

```bash
# Alternative: Install from Oracle Linux repos
sudo dnf module list nodejs
sudo dnf module install nodejs:18
# Or manually install latest LTS
```

### Network Issues

```bash
# Check network connectivity
ping -c 4 8.8.8.8

# Check DNS
nslookup google.com

# Check your public IP
curl ifconfig.me
```

---

## 📦 Package Management Comparison

| Task | Ubuntu | Oracle Linux 9 |
|------|--------|----------------|
| Update | `sudo apt update` | `sudo dnf update` |
| Install | `sudo apt install` | `sudo dnf install` |
| Search | `apt search` | `dnf search` |
| Remove | `sudo apt remove` | `sudo dnf remove` |
| Firewall | `ufw` | `firewalld` |
| User | `ubuntu` | `opc` |

---

## 🔧 Useful Oracle Linux 9 Commands

### System Information
```bash
# OS version
cat /etc/oracle-release

# Kernel version
uname -r

# System resources
free -h
df -h
```

### Service Management
```bash
# Check if firewalld is running
sudo systemctl status firewalld

# Start/stop firewalld
sudo systemctl start firewalld
sudo systemctl stop firewalld

# Enable/disable on boot
sudo systemctl enable firewalld
sudo systemctl disable firewalld
```

### Network Information
```bash
# Show network interfaces
ip addr

# Show routing table
ip route

# Show open ports
sudo ss -tulpn
```

---

## 🎯 Complete Setup Checklist for Oracle Linux 9

- [ ] SSH to VM as `opc` user (not `ubuntu`)
- [ ] Run `sudo dnf update -y`
- [ ] Install Node.js 20.x using NodeSource
- [ ] Install Git
- [ ] Install development tools
- [ ] Configure firewalld (ports 3000/tcp, 20777/udp)
- [ ] Check SELinux (set to permissive if issues)
- [ ] Install PM2 globally
- [ ] Upload project files
- [ ] Run `npm install`
- [ ] Start server with PM2
- [ ] Test dashboard in browser
- [ ] Configure F1 25 (when home)

---

## 🚀 Quick Command Summary

```bash
# Update system
sudo dnf update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git

# Configure firewall
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=20777/udp
sudo firewall-cmd --reload

# Install PM2
sudo npm install -g pm2

# Upload files, then:
cd ~/f1-telemetry-poc
npm install
pm2 start server.js --name f1-telemetry
pm2 save
pm2 startup

# Access dashboard
http://YOUR_VM_IP:3000
```

---

## 📝 Oracle Linux Specific Notes

### 1. Default User
- Ubuntu: `ubuntu`
- **Oracle Linux: `opc`** ⚠️

### 2. Firewall
- Ubuntu: `ufw`
- **Oracle Linux: `firewalld`** ⚠️

### 3. Package Manager
- Ubuntu: `apt`/`apt-get`
- **Oracle Linux: `dnf`** (or `yum`) ⚠️

### 4. SELinux
- Oracle Linux has **SELinux enabled** by default
- May need to configure policies for custom ports
- Check with `getenforce`

### 5. Performance
- Oracle Linux is optimized for Oracle workloads
- Great choice for later Oracle Database integration! ✅

---

## 🎉 Advantages of Oracle Linux 9

✅ **Oracle Optimized** - Perfect for Oracle Cloud and DB
✅ **Enterprise Support** - Premium support available
✅ **Performance** - Tuned for Oracle workloads
✅ **Security** - SELinux, secure by default
✅ **Free** - Zero cost on OCI
✅ **Compatible** - RHEL-compatible (uses RPM)

---

## 🔗 Resources

- [Oracle Linux Documentation](https://docs.oracle.com/en/operating-systems/oracle-linux/)
- [firewalld Documentation](https://firewalld.org/documentation/)
- [Node.js RPM Setup](https://github.com/nodesource/distributions)
- [SELinux Guide](https://docs.oracle.com/en/operating-systems/oracle-linux/selinux/)

---

## ✅ You're Ready!

Oracle Linux 9 is actually a **great choice** for this project because:
- Native Oracle Cloud integration
- Better performance for Oracle DB (future phase)
- Enterprise-grade security
- Professional environment

Follow the steps above and you'll be up and running! 🏁

