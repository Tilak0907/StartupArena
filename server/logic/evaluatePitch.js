const admin = require("firebase-admin");
const { mapPitchToFeatures } = require("./attributeMapper");
const { runRandomForest } = require("./randomForest");

async function evaluatePitch(newPitch, previousPitches = []) {

  const db = admin.firestore();

  /* =====================================
     STEP 1: FEATURE VECTOR
  ===================================== */

  const features = await mapPitchToFeatures(
    newPitch,
    previousPitches
  ) || [0,0,0,0,0,0,0,0,0,0];

  console.log("Generated Features:", features);

  /* =====================================
     STEP 2: SAVE FEATURE VECTOR
  ===================================== */

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

  /* =====================================
     STEP 3: RANDOM FOREST
  ===================================== */

  const modelResult = await runRandomForest(
    features,
    previousPitches
  );

  const prediction = modelResult.prediction || "Needs Improvement";

  const probability = modelResult.probability || 0;

  /* =====================================
     STEP 4: STRUCTURED FEATURE SCORES
  ===================================== */

  const problemScore = features[0] || 0;
  const solutionScore = features[1] || 0;
  const marketScore = features[2] || 0;
  const revenueScore = features[3] || 0;
  const pitchLengthScore = features[4] || 0;

  const structuredAverage =
    (
      problemScore +
      solutionScore +
      marketScore +
      revenueScore +
      pitchLengthScore
    ) / 5;

  /* =====================================
     STEP 5: SCORE CALCULATION
  ===================================== */

  const modelScore = probability * 100;

  const featureScore = (structuredAverage / 3) * 100;

  let score =
    (modelScore * 0.4) +
    (featureScore * 0.6);

  /* =====================================
     STEP 6: PENALTY FOR VERY WEAK PITCH
  ===================================== */

  if (structuredAverage < 0.5) {

    score = score * 0.6;

  }

  /* =====================================
     STEP 7: CLAMP SCORE
  ===================================== */

  score = Math.round(score);

  score = Math.max(10, Math.min(score, 95));

  /* =====================================
     STEP 8: STRENGTHS / WEAKNESSES
  ===================================== */

  const strengths = [];
  const weaknesses = [];

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

  if (pitchLengthScore >= 2)
    strengths.push("Pitch provides sufficient detail.");
  else
    weaknesses.push("Pitch needs more explanation and detail.");

  /* =====================================
     STEP 9: RETURN RESULT
  ===================================== */

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

/* =====================================
   HELPERS
===================================== */

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