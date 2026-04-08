const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// 1. Load the Service Account Key
// Based on your image, firebaseKey.json is in the same folder as this script.
const serviceAccount = require("./firebaseKey.json");

// 2. Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/* =====================================
   SEED DATABASE FROM JSON FILE
===================================== */
async function seedStartups() {
  try {
    // Define the path to startups.json
    const filePath = path.join(__dirname, "startups.json");
    
    console.log(`🔍 Looking for file at: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("❌ Error: startups.json file not found in the server directory!");
      process.exit(1);
    }

    // Read and parse the data
    const rawData = fs.readFileSync(filePath, "utf8");
    const startups = JSON.parse(rawData);

    // Validation: Ensure the JSON is an array
    if (!Array.isArray(startups)) {
      console.error("❌ Error: startups.json must contain an array of startup objects.");
      process.exit(1);
    }

    console.log(`🚀 Starting seeding for ${startups.length} startups...`);

    for (const startup of startups) {
      // Validate that the startup has a name to create the ID
      if (!startup.name) {
        console.warn("⚠️ Skipping a startup entry because it is missing a 'name' field.");
        continue;
      }

      // Create a slugified ID (e.g., "Too Good To Go" -> "too_good_to_go")
      const docId = startup.name.toLowerCase().replace(/\s+/g, "_");
      
      // Use .set() so it updates existing data rather than creating duplicates
      await db.collection("startups").doc(docId).set({
        ...startup,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isSuccessCase: true 
      });

      console.log(`✅ Inserted/Updated Startup: ${startup.name}`);
    }

    console.log("\n✨ --- Seeding Completed Successfully --- ✨");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding process:", error.message);
    process.exit(1);
  }
}

// Run the function
seedStartups();