const { mapPitchToFeatures } = require("./attributeMapper");

/**
 * Structured Evaluation Matrix Calculation
 * Uses Random Forest probability + structured features
 *
 * @param {Object} pitch
 * @param {Number} modelProbability
 * @param {Array} previousPitches
 */

async function evaluateMatrix(pitch, modelProbability = 0, previousPitches = []) {

  const features = await mapPitchToFeatures(pitch, previousPitches) || [];

  const problemScore = features[0] || 0;
  const solutionScore = features[1] || 0;
  const marketScore = features[2] || 0;
  const revenueScore = features[3] || 0;
  const pitchLengthScore = features[4] || 0;

  /* ===============================
     1️⃣ PROBLEM SCORE
  =============================== */

  let problemMatrixScore = 20 + (problemScore * 25);
  problemMatrixScore = clamp(problemMatrixScore);

  /* ===============================
     2️⃣ SOLUTION SCORE
  =============================== */

  let solutionMatrixScore = 20 + (solutionScore * 25);
  solutionMatrixScore = clamp(solutionMatrixScore);

  /* ===============================
     3️⃣ MARKET SCORE
  =============================== */

  let marketMatrixScore = 20 + (marketScore * 25);
  marketMatrixScore = clamp(marketMatrixScore);

  /* ===============================
     4️⃣ REVENUE SCORE
  =============================== */

  let revenueMatrixScore = 20 + (revenueScore * 25);
  revenueMatrixScore = clamp(revenueMatrixScore);

  /* ===============================
     5️⃣ PITCH QUALITY SCORE
  =============================== */

  let pitchQualityScore = 20 + (pitchLengthScore * 25);
  pitchQualityScore = clamp(pitchQualityScore);

  /* ===============================
     6️⃣ RANDOM FOREST SCORE
  =============================== */

  const modelScore = Math.round((modelProbability || 0) * 100);

  /* ===============================
     7️⃣ FINAL OVERALL SCORE
  =============================== */

  const overallScore = Math.round(
    (
      problemMatrixScore +
      solutionMatrixScore +
      marketMatrixScore +
      revenueMatrixScore +
      pitchQualityScore +
      modelScore
    ) / 6
  );

  return {

    problemScore: problemMatrixScore,
    solutionScore: solutionMatrixScore,
    marketScore: marketMatrixScore,
    revenueScore: revenueMatrixScore,
    pitchQualityScore,
    modelScore,
    overallScore

  };

}

/* ===============================
   Helper
=============================== */

function clamp(value) {

  return Math.max(0, Math.min(100, Math.round(value)));

}

module.exports = { evaluateMatrix };