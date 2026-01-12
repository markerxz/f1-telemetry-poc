module.exports = {
  apps: [{
    name: 'f1-telemetry',
    script: './server.js',
    cwd: '/home/opc/f1-telemetry-poc',
    env: {
      LD_LIBRARY_PATH: '/usr/lib/oracle/19.29/client64/lib',
      TNS_ADMIN: '/home/opc/.oracle/wallets/f1_adb_oci',
      WALLET_LOCATION: '/home/opc/.oracle/wallets/f1_adb_oci',
      DB_USER: 'ADMIN',
      DB_PASSWORD: 'ppPPPP__253fSEDF8675__3fcdvbj',
      DB_CONNECT_STRING: 'adbforailowercost_tpurgent',
      NODE_ENV: 'production',
      MODULES_RUN_QUARANTINE: ''
    }
  }]
};

