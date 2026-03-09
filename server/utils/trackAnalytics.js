const admin = require("firebase-admin");

async function trackEvent(eventName) {

  try {

    const db = admin.firestore(); // get firestore AFTER initialization

    const today = new Date().toISOString().split("T")[0];

    const ref = db.collection("appAnalytics").doc(today);

    await ref.set(
      {
        [eventName]: admin.firestore.FieldValue.increment(1)
      },
      { merge: true }
    );

  } catch (error) {

    console.error("Analytics tracking error:", error);

  }

}

module.exports = { trackEvent };