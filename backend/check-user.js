const { db } = require('./config/firebase');

async function checkUser() {
    try {
        console.log("Checking user 'bvricebca12' in Firestore...");
        const userSnapshot = await db.collection("users").where("username", "==", "bvricebca12").get();

        if (userSnapshot.empty) {
            console.log("❌ USER NOT FOUND in Firestore collection 'users'");

            // Check all users
            const allUsers = await db.collection("users").get();
            console.log(`Total users in DB: ${allUsers.size}`);
            allUsers.forEach(doc => {
                console.log(`- Found username: ${doc.data().username}`);
            });
        } else {
            const user = userSnapshot.docs[0].data();
            console.log("✅ USER FOUND:");
            console.log("- Username:", user.username);
            console.log("- Role:", user.role);
            console.log("- Has Password Hash:", !!user.password);
        }
    } catch (err) {
        console.error("Error checking user:", err.message);
    }
}

checkUser();
