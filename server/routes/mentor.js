const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// POST: Assign mentor
router.post("/assign", async (req, res) => {
  try {
    const { profileId, mentorId, founderId } = req.body;

    if (!profileId || !mentorId || !founderId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = admin.firestore();

    // 🔥 1️⃣ Check duplicate assignment
    const duplicateQuery = await db.collection("mentorAssignments")
      .where("profileId", "==", profileId)
      .where("mentorId", "==", mentorId)
      .get();

    if (!duplicateQuery.empty) {
      return res.status(400).json({
        message: "You have already assigned this mentor."
      });
    }

    // 🔥 2️⃣ Save assignment
    await db.collection("mentorAssignments").add({
      profileId,
      mentorId,
      founderId,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 🔥 3️⃣ Fetch mentor email
    const mentorDoc = await db.collection("users").doc(mentorId).get();

    if (!mentorDoc.exists) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const mentorData = mentorDoc.data();

    // 🔥 4️⃣ Fetch profile info
    const profileDoc = await db.collection("profiles").doc(profileId).get();
    const profileData = profileDoc.data();

    // 🔥 5️⃣ Send Email
    const msg = {
      to: mentorData.email,
      from: process.env.SENDER_EMAIL,
      subject: "New Startup Pitch Assigned",
      text: `
Hello Mentor,

A new startup pitch has been assigned to you.

Startup Name: ${profileData.name}
Industry: ${profileData.industry}
Vision: ${profileData.vision}

Please login to StartupArena to review.

StartupArena Team
      `
    };

    await sgMail.send(msg);

    return res.status(200).json({
      message: "Mentor assigned and email sent successfully"
    });

  } catch (error) {
    console.error("Assignment error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;