const { mapPitchToItems } = require("./attributeMapper");

/**
 * Structured Evaluation Matrix Calculation
 * @param {Object} pitch
 * @param {Number} patternScore (ECLAT score)
 */
async function evaluateMatrix(pitch, patternScore = 0) {

  const items = await mapPitchToItems(pitch);

  /* ===============================
     1️⃣ PROBLEM SCORE
  =============================== */
  let problemScore = 40;

  if (items.includes("strong_problem")) problemScore += 40;
  if (items.includes("weak_problem")) problemScore -= 10;

  problemScore = clamp(problemScore);

  /* ===============================
     2️⃣ SOLUTION SCORE
  =============================== */
  let solutionScore = 40;

  if (items.includes("innovative_solution")) solutionScore += 40;
  if (items.includes("basic_solution")) solutionScore += 10;
  if (items.includes("weak_solution")) solutionScore -= 10;

  solutionScore = clamp(solutionScore);

  /* ===============================
     3️⃣ MARKET SCORE
  =============================== */
  let marketScore = 40;

  if (items.includes("large_market")) marketScore += 40;
  if (items.includes("niche_market")) marketScore += 15;
  if (items.includes("unclear_market")) marketScore -= 10;

  marketScore = clamp(marketScore);

  /* ===============================
     4️⃣ REVENUE SCORE
  =============================== */
  let revenueScore = 40;

  if (items.includes("strong_revenue_model")) revenueScore += 40;
  if (items.includes("basic_revenue_model")) revenueScore += 10;
  if (items.includes("undefined_revenue_model")) revenueScore -= 10;

  revenueScore = clamp(revenueScore);

  /* ===============================
     5️⃣ PATTERN SCORE (ECLAT)
  =============================== */
  const patternMatchScore = patternScore;

  /* ===============================
     6️⃣ FINAL OVERALL SCORE
  =============================== */

  const overallScore = Math.round(
    (problemScore +
      solutionScore +
      marketScore +
      revenueScore +
      patternMatchScore) / 5
  );

  return {
    problemScore,
    solutionScore,
    marketScore,
    revenueScore,
    patternMatchScore,
    overallScore
  };
}

/* ===============================
   Helper
=============================== */
function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

module.exports = { evaluateMatrix };
