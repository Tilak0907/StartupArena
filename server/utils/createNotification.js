const db = require("../firebaseAdmin");

async function createNotification(userId, title, message) {

  try {

    await db.collection("notifications").add({
      userId: userId,
      title: title,
      message: message,
      read: false,
      createdAt: new Date()
    });

  } catch (error) {

    console.error("Notification error:", error);

  }

}

module.exports = createNotification;