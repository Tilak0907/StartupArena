const admin = require("firebase-admin");
const { mapPitchToFeatures } = require("./attributeMapper");
const { runRandomForest } = require("./randomForest");

async function evaluatePitch(newPitch, previousPitches) {

  // 🔹 create firestore instance
  const db = admin.firestore();

  /* STEP 1: FEATURE VECTOR */

  const features = await mapPitchToFeatures(
    newPitch,
    previousPitches
  );

  /* STEP 2: SAVE FEATURE VECTOR */

  try {

    await db.collection("featureVectors").add({

      userId: newPitch.userId || "unknown",

      features: features,

      label: newPitch.successLabel || null,

      createdAt: admin.firestore.FieldValue.serverTimestamp()

    });

  } catch (error) {

    console.error("Feature vector save error:", error);

  }

  /* STEP 3: RANDOM FOREST */

  const modelResult = await runRandomForest(
    features,
    previousPitches
  );

  const prediction = modelResult.prediction;
  const probability = modelResult.probability;

  /* STEP 4: SCORE */

  let score = Math.round(probability * 100);

  score = Math.max(20, Math.min(score, 95));

  /* STEP 5: STRENGTHS / WEAKNESSES */

  const strengths = [];
  const weaknesses = [];

  const [
    problemScore,
    solutionScore,
    marketScore,
    revenueScore
  ] = features;

  if (problemScore >= 2)
    strengths.push("Strong problem definition.");
  else
    weaknesses.push("Problem statement needs improvement.");

  if (solutionScore >= 2)
    strengths.push("Innovative solution.");
  else
    weaknesses.push("Solution needs stronger differentiation.");

  if (marketScore >= 2)
    strengths.push("Large market opportunity.");
  else
    weaknesses.push("Target market needs clarity.");

  if (revenueScore >= 2)
    strengths.push("Clear revenue model.");
  else
    weaknesses.push("Revenue model needs improvement.");

  return {

    evaluationType: "Random Forest Startup Evaluation",

    readiness: getReadiness(score),

    score,

    confidence: getConfidence(score),

    prediction,

    strengths,

    weaknesses,

    evaluatedAt: new Date()

  };

}

/* HELPERS */

function getReadiness(score) {

  if (score >= 75) return "High";
  if (score >= 45) return "Medium";
  return "Low";

}

function getConfidence(score) {

  if (score >= 75) return "High";
  if (score >= 45) return "Moderate";
  return "Low";

}

module.exports = { evaluatePitch };