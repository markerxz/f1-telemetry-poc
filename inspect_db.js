const db = require('./database');

async function inspect() {
    console.log('Connecting to database...');
    const initialized = await db.initialize();
    if (!initialized) {
        console.error('Failed to connect.');
        return;
    }

    console.log('Fetching recent laps...');
    const laps = await db.getRecentLaps(5);

    if (laps.length === 0) {
        console.log('No laps found.');
    } else {
        console.log('Last 5 laps:');
        laps.forEach(lap => {
            console.log('------------------------------------------------');
            console.log(`Lap ${lap.LAP_NUMBER} - ${lap.DRIVER_NAME}`);
            console.log(`Time (MS): ${lap.LAP_TIME_MS}`);
            console.log(`Time (Fmt): ${lap.LAP_TIME_FORMATTED}`);
            console.log(`S1 (Fmt): ${lap.SECTOR1_FORMATTED}`);
            console.log(`S2 (Fmt): ${lap.SECTOR2_FORMATTED}`);
            console.log(`S3 (Fmt): ${lap.SECTOR3_FORMATTED}`);
        });
    }

    await db.close();
}

inspect();
