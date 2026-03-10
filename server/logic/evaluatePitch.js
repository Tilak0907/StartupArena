const admin = require("firebase-admin");
const { mapPitchToFeatures } = require("./attributeMapper");
const { runRandomForest } = require("./randomForest");

async function evaluatePitch(newPitch, previousPitches) {

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
  const probability = modelResult.probability || 0;

  /* STEP 4: FEATURE CONTRIBUTION */

  const [
    problemScore,
    solutionScore,
    marketScore,
    revenueScore
  ] = features;

  const featureAverage =
    (problemScore +
      solutionScore +
      marketScore +
      revenueScore) / 4;

  /* STEP 5: FINAL SCORE CALCULATION */

  const modelScore = probability * 100;
  const featureScore = (featureAverage / 3) * 100;

  let score =
    (modelScore * 0.7) +
    (featureScore * 0.3);

  score = Math.round(score);

  score = Math.max(20, Math.min(score, 100));

  /* STEP 6: STRENGTHS / WEAKNESSES */

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

  /* STEP 7: RETURN RESULT */

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