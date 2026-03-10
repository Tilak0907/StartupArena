const admin = require("firebase-admin");
const natural = require("natural");

const TfIdf = natural.TfIdf;

/*
Firebase Admin already initialized in index.js
*/

async function mapPitchToFeatures(pitch, previousPitches = []) {

  const problem = (pitch.problem || "").toLowerCase().trim();
  const solution = (pitch.solution || "").toLowerCase().trim();
  const market = (pitch.market || "").toLowerCase().trim();
  const revenue = (pitch.revenue || "").toLowerCase().trim();

  try {

    const db = admin.firestore();

    /* =====================================
       FETCH KEYWORD CONFIG
    ===================================== */

    const configSnapshot = await db
      .collection("keywordConfig")
      .limit(1)
      .get();

    if (configSnapshot.empty) {

      console.log("Keyword config missing");

      return [0,0,0,0,0,0,0,0,0,0];

    }

    const config = configSnapshot.docs[0].data();

    const problemKeywords = config.problem || [];
    const solutionKeywords = config.solution || [];
    const marketKeywords = config.market || [];
    const revenueKeywords = config.revenue || [];

    /* =====================================
       PROBLEM SCORE
    ===================================== */

    let problemScore = 0;

    problemKeywords.forEach(keyword => {

      if (problem.includes(keyword)) {
        problemScore++;
      }

    });

    problemScore = Math.min(problemScore, 3);

    /* =====================================
       SOLUTION SCORE
    ===================================== */

    let solutionScore = 0;

    solutionKeywords.forEach(keyword => {

      if (solution.includes(keyword)) {
        solutionScore++;
      }

    });

    solutionScore = Math.min(solutionScore, 3);

    /* =====================================
       MARKET SCORE
    ===================================== */

    let marketScore = 0;

    marketKeywords.forEach(keyword => {

      if (market.includes(keyword)) {
        marketScore++;
      }

    });

    marketScore = Math.min(marketScore, 3);

    /* =====================================
       REVENUE SCORE
    ===================================== */

    let revenueScore = 0;

    revenueKeywords.forEach(keyword => {

      if (revenue.includes(keyword)) {
        revenueScore++;
      }

    });

    revenueScore = Math.min(revenueScore, 3);

    /* =====================================
       PITCH LENGTH SCORE
    ===================================== */

    const fullPitch =
      problem + " " +
      solution + " " +
      market + " " +
      revenue;

    const wordCount = fullPitch.split(/\s+/).filter(w => w).length;

    let pitchLengthScore = 0;

    if (wordCount > 120) pitchLengthScore = 3;
    else if (wordCount > 60) pitchLengthScore = 2;
    else if (wordCount > 25) pitchLengthScore = 1;
    else pitchLengthScore = 0;

    /* =====================================
       PENALTY FOR VERY WEAK TEXT
    ===================================== */

    if (wordCount < 10) {

      return [0,0,0,0,0,0,0,0,0,0];

    }

    /* =====================================
       TF-IDF FEATURE GENERATION
    ===================================== */

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

        tfidfFeatures.push(
          Number(tfidfTerms[i].tfidf.toFixed(4))
        );

      } else {

        tfidfFeatures.push(0);

      }

    }

    /* =====================================
       FINAL FEATURE VECTOR
    ===================================== */

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

    console.error("Feature mapping error:", error);

    return [0,0,0,0,0,0,0,0,0,0];

  }

}

module.exports = { mapPitchToFeatures };