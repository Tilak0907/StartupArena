const admin = require("firebase-admin");
const serviceAccount = require("./firebaseKey.json");

const pitches = require("./seedPitches.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedData() {

  try {

    for (const pitch of pitches) {

      await db.collection("pitches").add({
        ...pitch,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log("Inserted pitch:", pitch.userId);

    }

    console.log("All pitches inserted successfully!");

    process.exit();

  } catch (error) {

    console.error("Error inserting data:", error);

    process.exit(1);

  }

}

seedData();