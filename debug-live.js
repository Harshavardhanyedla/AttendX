const { db } = require('./backend/config/firebase');

async function debugLive() {
    try {
        console.log("Checking Live Monitor Logic...");

        // Mock current day as Monday for testing
        // const day = 'Monday'; 
        // Or actually use today?
        // Let's use Monday since we know data exists
        const day = 'Monday';
        const date = new Date().toISOString().split('T')[0];

        console.log(`Querying for Day: ${day}, Date: ${date}`);

        const periodsSnapshot = await db.collection("timetable")
            .where("day", "==", day)
            // .orderBy("period") // We removed this
            .get();

        const periods = periodsSnapshot.docs
            .map(d => d.data())
            .sort((a, b) => a.period - b.period);

        console.log(`Found ${periods.length} periods.`);
        periods.forEach(p => console.log(`P${p.period}: ${p.subject_name}`));

    } catch (error) {
        console.error("Error:", error);
    }
}

debugLive();
