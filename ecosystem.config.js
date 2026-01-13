module.exports = {
  apps: [{
    name: 'f1-telemetry',
    script: './server.js',
    cwd: '/home/opc/f1-telemetry-poc',
    env: {
      LD_LIBRARY_PATH: '/usr/lib/oracle/19.29/client64/lib',
      TNS_ADMIN: '/home/opc/.oracle/wallets/f1data_wallet',
      WALLET_LOCATION: '/home/opc/.oracle/wallets/f1data_wallet',
      DB_USER: 'ADMIN',
      DB_PASSWORD: 'Mamarkrknstda4411!',
      DB_CONNECT_STRING: 'f1data_tpurgent',
      NODE_ENV: 'production',
      MODULES_RUN_QUARANTINE: ''
    }
  }]
};

