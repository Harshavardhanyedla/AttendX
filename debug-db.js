const { db } = require('./backend/config/firebase');

async function debugFirestore() {
    try {
        console.log("Checking Timetable...");
        const snapshot = await db.collection('timetable').get();
        if (snapshot.empty) {
            console.log("Timetable collection is EMPTY.");
        } else {
            console.log(`Timetable has ${snapshot.size} documents.`);
            const monday = snapshot.docs.filter(d => d.data().day === 'Monday');
            console.log(`Monday entries: ${monday.length}`);
            monday.forEach(d => console.log(d.data()));
        }

        console.log("\nChecking Students...");
        const stuSnap = await db.collection('students').get();
        console.log(`Students collection has ${stuSnap.size} documents.`);

    } catch (error) {
        console.error("Error querying Firestore:", error);
    }
}

debugFirestore();
