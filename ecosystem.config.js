module.exports = {
  apps: [{
    name: 'f1-telemetry',
    script: './server.js',
    cwd: '/home/opc/f1-telemetry-poc',
    env: {
      LD_LIBRARY_PATH: '/usr/lib/oracle/19.29/client64/lib',
      TNS_ADMIN: '/home/opc/.oracle/wallets/f1test_wallet',
      WALLET_LOCATION: '/home/opc/.oracle/wallets/f1test_wallet',
      DB_USER: 'ADMIN',
      DB_PASSWORD: 'Mamarkrknstdaoracle4411!',
      DB_CONNECT_STRING: '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-singapore-1.oraclecloud.com))(connect_data=(service_name=g4eb1ecbb989e2a_f1test_tpurgent.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))',
      NODE_ENV: 'production',
      MODULES_RUN_QUARANTINE: ''
    }
  }]
};

