#!/bin/bash
# Deploy F1 Telemetry to AIS Cloud VM
# VM IP: 134.185.172.57

echo "=== F1 Telemetry Deployment to AIS Cloud VM ==="
echo ""

# Step 1: Create wallet directory on VM
echo "Step 1: Creating wallet directory on VM..."
ssh -i f1telemetry.key opc@134.185.172.57 "mkdir -p ~/.oracle/wallets/f1data_wallet"
echo "✓ Wallet directory created"
echo ""

# Step 2: Transfer wallet files
echo "Step 2: Transferring wallet files..."
scp -i f1telemetry.key C:/NoSync/F1/Wallet_f1data/* opc@134.185.172.57:~/.oracle/wallets/f1data_wallet/
echo "✓ Wallet files transferred"
echo ""

# Step 3: Verify wallet transfer
echo "Step 3: Verifying wallet files..."
ssh -i f1telemetry.key opc@134.185.172.57 "ls -la ~/.oracle/wallets/f1data_wallet/"
echo ""

# Step 4: Deploy application code
echo "Step 4: Deploying application code..."
echo "Checking if project directory exists..."
ssh -i f1telemetry.key opc@134.185.172.57 "test -d ~/f1-telemetry-poc && echo 'Directory exists' || echo 'Directory does not exist'"
echo ""

echo "=== Deployment Steps Complete ==="
echo ""
echo "Next steps (manual):"
echo "1. SSH to VM: ssh -i f1telemetry.key opc@134.185.172.57"
echo "2. Navigate to project: cd ~/f1-telemetry-poc"
echo "3. Pull latest code: git pull"
echo "4. Install dependencies: npm install"
echo "5. Restart PM2: pm2 restart f1-telemetry"
echo "6. Check logs: pm2 logs f1-telemetry"
