/* ================================
   SERVER SETUP
================================ */

require("dotenv").config(); // ✅ Added for SendGrid

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail"); // ✅ Added
//const serviceAccount = require("./firebaseKey.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY)

const { evaluatePitch } = require("./logic/evaluatePitch");

const app = express();
app.use(cors());
app.use(express.json());

const { trackEvent } = require("./utils/trackAnalytics");

/* ================================
   SENDGRID CONFIGURATION (NEW)
================================ */

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ================================
   FIREBASE INITIALIZATION
================================ */

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/* =========================================================
   🔔 CREATE NOTIFICATION FUNCTION
========================================================= */

async function createNotification(userId, title, message) {
  try {

    await db.collection("notifications").add({
      userId,
      title,
      message,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("Notification created");

  } catch (error) {

    console.error("Notification error:", error);

  }
}

/* =========================================================
   🆕 0️⃣ ASSIGN MENTOR + SEND EMAIL
========================================================= */

app.post("/api/mentor/assign", async (req, res) => {

  try {

    const { profileId, mentorId, founderId } = req.body;

    if (!profileId || !mentorId || !founderId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    /* =========================================
       CHECK IF MENTOR ALREADY ASSIGNED
    ========================================= */

    const assignmentQuery = await db.collection("mentorAssignments")
      .where("profileId", "==", profileId)
      .where("mentorId", "==", mentorId)
      .get();

    if (!assignmentQuery.empty) {

      const assignment = assignmentQuery.docs[0].data();

      /* =========================================
         FETCH CURRENT PITCH
      ========================================= */

      const pitchQuery = await db.collection("pitches")
        .where("userId", "==", founderId)
        .get();

      if (!pitchQuery.empty) {

        const pitchData = pitchQuery.docs[0].data();

        const pitchUpdated =
          pitchData.updatedAt?.seconds || 0;

        const assignedTime =
          assignment.createdAt?.seconds || 0;

        /* =========================================
           BLOCK IF PITCH NOT UPDATED
        ========================================= */

        if (pitchUpdated <= assignedTime) {

          return res.status(400).json({
            message: "Mentor already assigned to this profile"
          });

        }

      }

    }

    /* =========================================
       CREATE NEW ASSIGNMENT
    ========================================= */

    await db.collection("mentorAssignments").add({

      profileId,
      mentorId,
      founderId,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()

    });

    /* =========================================
       FETCH MENTOR DETAILS
    ========================================= */

    const mentorDoc =
      await db.collection("users").doc(mentorId).get();

    if (!mentorDoc.exists) {

      return res.status(404).json({
        message: "Mentor not found"
      });

    }

    const mentorData = mentorDoc.data();

    /* =========================================
       FETCH PROFILE DETAILS
    ========================================= */

    const profileDoc =
      await db.collection("profiles").doc(profileId).get();

    const profileData =
      profileDoc.exists ? profileDoc.data() : {};

    /* =========================================
       SEND EMAIL
    ========================================= */

    const msg = {

      to: mentorData.email,

      from: process.env.SENDER_EMAIL,

      subject: "New Startup Pitch Assigned",

      text: `
Hello ${mentorData.name || "Mentor"},

A new startup pitch has been assigned to you.

Startup Name: ${profileData.name || "N/A"}
Industry: ${profileData.industry || "N/A"}
Vision: ${profileData.vision || "N/A"}

Please login to StartupArena to review the pitch.

StartupArena Team
      `

    };

    await sgMail.send(msg);

    /* =========================================
       CREATE NOTIFICATION
    ========================================= */

    await createNotification(

      mentorId,
      "New Pitch Assigned",
      "A startup pitch has been assigned to you"

    );

    res.json({

      message: "Mentor assigned successfully and email sent"

    });

  } catch (error) {

    console.error("Mentor assignment error:", error);

    res.status(500).json({

      message: "Server error"

    });

  }

});


/* =========================================================
   1️⃣ EVALUATION ROUTE (RANDOM FOREST VERSION)
========================================================= */

app.post("/evaluate", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userPitchSnapshot = await db
      .collection("pitches")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (userPitchSnapshot.empty) {
      return res.status(404).json({
        message: "No pitch found for this user",
      });
    }

    const currentPitch = userPitchSnapshot.docs[0].data();

    const allSnapshot = await db.collection("pitches").get();
    const allPitches = allSnapshot.docs.map(doc => doc.data());

    const previousPitches = allPitches.filter(
      p => p.userId !== userId
    );

    const evaluation = await evaluatePitch(
      currentPitch,
      previousPitches
    );

    // user tracking
    await trackEvent("evaluations");


    /* Original Safe Matrix */
    let safeMatrix = evaluation.matrix
      ? {
          innovation: evaluation.matrix.innovation || false,
          feasibility: evaluation.matrix.feasibility || false,
          marketPotential: evaluation.matrix.marketPotential || false,
          executionReadiness: evaluation.matrix.executionReadiness || false,
        }
      : {
          innovation: false,
          feasibility: false,
          marketPotential: false,
          executionReadiness: false,
        };

    /* 🆕 Retrieve saved matrix if exists */
    const savedMatrixDoc = await db.collection("evaluationMatrix").doc(userId).get();
    if (savedMatrixDoc.exists) {
      const savedMatrix = savedMatrixDoc.data().matrix;
      safeMatrix = {
        innovation: savedMatrix.innovation || false,
        feasibility: savedMatrix.feasibility || false,
        marketPotential: savedMatrix.marketPotential || false,
        executionReadiness: savedMatrix.executionReadiness || false,
      };
    }

    /* 🆕 Retrieve TRL */
    const trlDoc = await db.collection("trlLevels").doc(userId).get();
    const trlLevel = trlDoc.exists ? trlDoc.data().level : 1;

    const finalResult = {
      userId,
      evaluationType: evaluation.evaluationType || "Random Forest Evaluation",
      readiness: evaluation.readiness || "Low",
      score: evaluation.score || 0,
      confidence: evaluation.confidence || "Low",
      prediction: evaluation.prediction || "Unknown",   // ✅ NEW FIELD
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      matrix: safeMatrix,
      trlLevel,
      status: "Completed",
      evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const existingEval = await db
      .collection("evaluationResults")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!existingEval.empty) {
      await existingEval.docs[0].ref.update(finalResult);
    } else {
      await db.collection("evaluationResults").add(finalResult);
    }

    res.json(finalResult);

  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({
      message: "Server error during evaluation",
    });
  }

});


/* =========================================================
   2️⃣ SAVE MATRIX (UNCHANGED)
========================================================= */

app.post("/saveMatrix", async (req, res) => {
  try {
    const { userId, matrix } = req.body;

    if (!userId || !matrix) {
      return res.status(400).json({ message: "Invalid data" });
    }

    await db.collection("evaluationMatrix").doc(userId).set({
      userId,
      matrix,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Matrix saved successfully" });

  } catch (error) {
    console.error("Matrix save error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================================================
   3️⃣ GET MATRIX (UNCHANGED)
========================================================= */

app.post("/getMatrix", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const doc = await db.collection("evaluationMatrix").doc(userId).get();

    if (!doc.exists) {
      return res.json({
        innovation: false,
        feasibility: false,
        marketPotential: false,
        executionReadiness: false,
      });
    }

    res.json(doc.data().matrix);

  } catch (error) {
    console.error("Matrix fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================================================
   4️⃣ SAVE TRL LEVEL (UNCHANGED)
========================================================= */

app.post("/saveTrl", async (req, res) => {
  try {
    const { userId, level, updatedBy } = req.body;

    if (!userId || !level) {
      return res.status(400).json({ message: "Invalid data" });
    }

    if (level < 1 || level > 9) {
      return res.status(400).json({
        message: "TRL must be between 1 and 9"
      });
    }

    await db.collection("trlLevels").doc(userId).set({
      userId,
      level,
      updatedBy: updatedBy || "founder",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "TRL updated successfully" });

  } catch (error) {
    console.error("TRL save error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================================================
   5️⃣ GET TRL LEVEL (UNCHANGED)
========================================================= */

app.post("/getTrl", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const doc = await db.collection("trlLevels").doc(userId).get();

    if (!doc.exists) {
      return res.json({ level: 1 });
    }

    res.json(doc.data());

  } catch (error) {
    console.error("TRL fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   CREATE CHAT ROOM
===================================================== */
app.post("/api/chat/create", async (req, res) => {
  try {
    const { founderId, mentorId } = req.body;

    if (!founderId || !mentorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if chat already exists
    const existingChats = await db.collection("chats")
      .where("participants", "array-contains", founderId)
      .get();

    let chatId = null;

    existingChats.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(mentorId)) {
        chatId = doc.id;
      }
    });

    if (chatId) {
      return res.json({ chatId });
    }

    // Create new chat
    const chatRef = await db.collection("chats").add({
      participants: [founderId, mentorId],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ chatId: chatRef.id });

  } catch (error) {
    console.error("Chat creation error:", error);
    res.status(500).json({ message: "Error creating chat" });
  }
});


/* =====================================================
   SEND MESSAGE + EMAIL NOTIFICATION (DEBUG SAFE VERSION)
===================================================== */
app.post("/api/chat/send", async (req, res) => {
  try {
    const { chatId, senderId, text } = req.body;

    if (!chatId || !senderId || !text || !text.trim()) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // 1️⃣ Check Chat Exists
    const chatDoc = await db.collection("chats").doc(chatId).get();

    if (!chatDoc.exists) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const chatData = chatDoc.data();

    console.log("Chat Data:", chatData);

    // 2️⃣ Save Message
    await db.collection("chats")
      .doc(chatId)
      .collection("messages")
      .add({
        senderId,
        text: text.trim(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    // 3️⃣ Identify Receiver
    if (!chatData.participants || chatData.participants.length < 2) {
      return res.status(400).json({ message: "Invalid participants array" });
    }

    const receiverId = chatData.participants.find(
      id => id !== senderId
    );

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver not found in participants" });
    }

    console.log("Receiver ID:", receiverId);

    // 4️⃣ Fetch Users
    const receiverDoc = await db.collection("users").doc(receiverId).get();
    const senderDoc = await db.collection("users").doc(senderId).get();

    if (!receiverDoc.exists) {
      return res.status(404).json({ message: "Receiver user not found" });
    }

    if (!senderDoc.exists) {
      return res.status(404).json({ message: "Sender user not found" });
    }

    const receiverEmail = receiverDoc.data().email;
    const senderEmail = senderDoc.data().email;

    if (!receiverEmail) {
      return res.status(400).json({ message: "Receiver email missing" });
    }

    console.log("Sending email to:", receiverEmail);

    // 5️⃣ Send Email
    const msg = {
      to: receiverEmail,
      from: process.env.SENDER_EMAIL,
      subject: "New Message - StartupArena",
      text: `
Hello,

${senderEmail} has sent you a new message:

"${text.trim()}"

Login to StartupArena to reply.

StartupArena Team
      `
    };

    await sgMail.send(msg);

    /* 🔔 Notification for Receiver */

await createNotification(
  receiverId,
  "New Message",
  `${senderEmail} sent you a message`
);

    console.log("Email sent successfully");

    res.json({ message: "Message saved and email sent" });

  } catch (error) {
    console.error("🔥 Message send error:", error.response?.body || error);
    res.status(500).json({ message: "Error sending message" });
  }
});


app.delete("/api/chat/delete/:chatId", async (req, res) => {

  try {

    const { chatId } = req.params;

    const messagesRef = db
      .collection("chats")
      .doc(chatId)
      .collection("messages");

    const snapshot = await messagesRef.get();

    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    await db.collection("chats").doc(chatId).delete();

    res.json({ message: "Chat and messages deleted successfully" });

  } catch (error) {

    console.error("Delete chat error:", error);

    res.status(500).json({ message: "Error deleting chat" });

  }

});



// mentor chat delete

app.delete("/api/chat/delete/:chatId", async (req, res) => {

  const { chatId } = req.params;

  const messages = await db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .get();

  const batch = db.batch();

  messages.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  await db.collection("chats").doc(chatId).delete();

  res.json({ message: "Chat deleted" });

});


/* =========================================================
   🔔 GET USER NOTIFICATIONS
========================================================= */

app.get("/api/notifications/:userId", async (req, res) => {

  try {

    const { userId } = req.params;

    const snapshot = await db.collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(notifications);

  } catch (error) {

    console.error("Notification fetch error:", error);

    res.status(500).json({
      message: "Error fetching notifications"
    });

  }

});


/* =========================================================
   🔔 MARK NOTIFICATION AS READ
========================================================= */

app.post("/api/notifications/read", async (req, res) => {

  try {

    const { notificationId } = req.body;

    await db.collection("notifications")
      .doc(notificationId)
      .update({
        read: true
      });

    res.json({ message: "Notification marked as read" });

  } catch (error) {

    console.error("Notification update error:", error);

    res.status(500).json({
      message: "Error updating notification"
    });

  }

});


// dashboard user tracking
app.post("/track-visit", async (req, res) => {

  await trackEvent("visits");

  res.json({ success: true });

});


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.send("🚀 StartupArena Backend Running");
});


/* =========================================================
   START SERVER
========================================================= */

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});