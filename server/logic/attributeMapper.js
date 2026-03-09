const admin = require("firebase-admin");
const natural = require("natural");

const TfIdf = natural.TfIdf;

/*
Firebase Admin already initialized in index.js
*/

async function mapPitchToFeatures(pitch, previousPitches = []) {

  const problem = (pitch.problem || "").toLowerCase();
  const solution = (pitch.solution || "").toLowerCase();
  const market = (pitch.market || "").toLowerCase();
  const revenue = (pitch.revenue || "").toLowerCase();

  try {

    const db = admin.firestore();

    /* =========================================================
       FETCH KEYWORDS FROM FIRESTORE
    ========================================================= */

    const configSnapshot = await db
      .collection("keywordConfig")
      .limit(1)
      .get();

    if (configSnapshot.empty) {
      console.log("No keyword configuration found.");
      return [0,0,0,0,0,0,0,0,0,0];
    }

    const config = configSnapshot.docs[0].data();

    const problemKeywords = config.problem || [];
    const solutionKeywords = config.solution || [];
    const marketKeywords = config.market || [];
    const revenueKeywords = config.revenue || [];

    /* =========================================================
       1️⃣ PROBLEM SCORE (keyword quality)
    ========================================================= */

    let problemScore = problemKeywords.filter(word =>
      problem.includes(word)
    ).length;

    problemScore = Math.min(problemScore, 2);

    /* =========================================================
       2️⃣ SOLUTION SCORE
    ========================================================= */

    let solutionScore = solutionKeywords.filter(word =>
      solution.includes(word)
    ).length;

    solutionScore = Math.min(solutionScore, 2);

    /* =========================================================
       3️⃣ MARKET SCORE
    ========================================================= */

    let marketScore = marketKeywords.filter(word =>
      market.includes(word)
    ).length;

    marketScore = Math.min(marketScore, 2);

    /* =========================================================
       4️⃣ REVENUE SCORE
    ========================================================= */

    let revenueScore = revenueKeywords.filter(word =>
      revenue.includes(word)
    ).length;

    revenueScore = Math.min(revenueScore, 2);

    /* =========================================================
       5️⃣ PITCH LENGTH SCORE
    ========================================================= */

    const fullPitch =
      problem + " " +
      solution + " " +
      market + " " +
      revenue;

    const wordCount = fullPitch.split(/\s+/).length;

    let pitchLengthScore = 0;

    if (wordCount > 80) pitchLengthScore = 2;
    else if (wordCount > 40) pitchLengthScore = 1;

    /* =========================================================
       TF-IDF FEATURE GENERATION
    ========================================================= */

    const tfidf = new TfIdf();

    const documents = previousPitches.map(p =>
      ((p.problem || "") + " " +
       (p.solution || "") + " " +
       (p.market || "") + " " +
       (p.revenue || "")).toLowerCase()
    );

    documents.push(fullPitch);

    documents.forEach(doc => tfidf.addDocument(doc));

    const tfidfTerms = tfidf.listTerms(documents.length - 1);

    const tfidfFeatures = [];

    for (let i = 0; i < 5; i++) {

      if (tfidfTerms[i]) {
        tfidfFeatures.push(Number(tfidfTerms[i].tfidf.toFixed(4)));
      } else {
        tfidfFeatures.push(0);
      }

    }

    /* =========================================================
       FINAL FEATURE VECTOR
    ========================================================= */

    const features = [
      problemScore,
      solutionScore,
      marketScore,
      revenueScore,
      pitchLengthScore,
      ...tfidfFeatures
    ];

    return features;

  } catch (error) {

    console.error("Keyword fetch error:", error);

    return [0,0,0,0,0,0,0,0,0,0];

  }

}

module.exports = { mapPitchToFeatures };