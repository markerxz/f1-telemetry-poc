# 🖥️ Platform Comparison - Ubuntu vs Oracle Linux 9

Quick reference for the key differences between Ubuntu and Oracle Linux 9 setup.

---

## 🔑 Key Differences

| Feature | Ubuntu 22.04 | Oracle Linux 9 |
|---------|--------------|----------------|
| **Package Manager** | `apt`/`apt-get` | `dnf`/`yum` |
| **Update Command** | `sudo apt update` | `sudo dnf update` |
| **Install Command** | `sudo apt install` | `sudo dnf install` |
| **Default User** | `ubuntu` | `opc` |
| **Firewall** | `ufw` | `firewalld` |
| **Security** | AppArmor | SELinux |
| **Init System** | systemd | systemd |
| **Base** | Debian | RHEL |

---

## 🔥 Firewall Commands

### Open Ports

**Ubuntu (ufw):**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 20777/udp
sudo ufw enable
sudo ufw status
```

**Oracle Linux (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=20777/udp
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

---

## 📦 Package Management

### Update System

**Ubuntu:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Oracle Linux:**
```bash
sudo dnf update -y
```

### Install Node.js

**Ubuntu:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Oracle Linux:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

### Install Git

**Ubuntu:**
```bash
sudo apt install -y git
```

**Oracle Linux:**
```bash
sudo dnf install -y git
```

---

## 🔐 SSH Connection

**Ubuntu:**
```bash
ssh -i your-key.key ubuntu@YOUR_VM_IP
```

**Oracle Linux:**
```bash
ssh -i your-key.key opc@YOUR_VM_IP
```

---

## 📊 Port Checking

### Check Listening Ports

**Ubuntu:**
```bash
sudo netstat -tulpn | grep 3000
sudo ss -tulpn | grep 3000
```

**Oracle Linux:**
```bash
sudo ss -tulpn | grep 3000
sudo ss -ulpn | grep 20777
```

---

## 🛡️ Security Differences

### Ubuntu (AppArmor)

```bash
# Check status
sudo aa-status

# Usually more permissive by default
```

### Oracle Linux (SELinux)

```bash
# Check status
getenforce
# Output: Enforcing, Permissive, or Disabled

# View SELinux denials
sudo ausearch -m avc -ts recent

# Temporarily set to permissive (for testing)
sudo setenforce 0

# Permanently disable (not recommended)
sudo nano /etc/selinux/config
# Change: SELINUX=permissive
```

**If SELinux blocks your ports:**
```bash
# Allow custom ports
sudo semanage port -a -t http_port_t -p tcp 3000
sudo semanage port -a -t unreserved_port_t -p udp 20777
```

---

## 🚀 Which Setup Script to Use?

### For Ubuntu 22.04:
```bash
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/setup-vm.sh
chmod +x setup-vm.sh
./setup-vm.sh
```

### For Oracle Linux 9:
```bash
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/setup-vm-oracle-linux.sh
chmod +x setup-vm-oracle-linux.sh
./setup-vm-oracle-linux.sh
```

---

## 💡 Recommendation

**For this F1 Telemetry Project:**

### Choose **Oracle Linux 9** if:
✅ You plan to use Oracle Autonomous Database (next phase)
✅ You want Oracle-optimized performance
✅ You prefer enterprise-grade security
✅ You're already using OCI

### Choose **Ubuntu 22.04** if:
✅ You're more familiar with Debian-based systems
✅ You want simpler firewall management (ufw)
✅ You prefer Ubuntu documentation/community
✅ You're using multi-cloud setup

**Both work perfectly for this project!** 🎯

---

## 🔧 Troubleshooting by Platform

### Ubuntu Issues

**Firewall blocking connections:**
```bash
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 20777/udp
```

**Port not listening:**
```bash
sudo netstat -tulpn | grep node
```

### Oracle Linux Issues

**SELinux blocking connections:**
```bash
# Check SELinux
getenforce

# Temporarily disable for testing
sudo setenforce 0

# Check logs
sudo ausearch -m avc -ts recent
```

**Firewall blocking connections:**
```bash
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 📚 Documentation Links

### Ubuntu
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [UFW Documentation](https://help.ubuntu.com/community/UFW)
- [APT Package Management](https://ubuntu.com/server/docs/package-management)

### Oracle Linux
- [Oracle Linux Documentation](https://docs.oracle.com/en/operating-systems/oracle-linux/)
- [firewalld Guide](https://firewalld.org/documentation/)
- [SELinux Guide](https://docs.oracle.com/en/operating-systems/oracle-linux/selinux/)
- [DNF Package Manager](https://docs.oracle.com/en/operating-systems/oracle-linux/software-management/)

---

## ✅ Quick Reference Card

### I have Oracle Linux 9, what do I do?

1. **Read:** `ORACLE_LINUX_GUIDE.md` (detailed guide)
2. **Use:** `setup-vm-oracle-linux.sh` (automated setup)
3. **SSH as:** `opc` user (not ubuntu)
4. **Firewall:** `firewalld` commands
5. **Package Manager:** `dnf` commands

### I have Ubuntu 22.04, what do I do?

1. **Read:** `DEPLOYMENT_GUIDE.md` (detailed guide)
2. **Use:** `setup-vm.sh` (automated setup)
3. **SSH as:** `ubuntu` user
4. **Firewall:** `ufw` commands
5. **Package Manager:** `apt` commands

---

## 🎯 Bottom Line

**Same F1 telemetry code works on both!** 

Only the system setup differs. Choose the guide that matches your Linux distribution and you're good to go! 🏁

