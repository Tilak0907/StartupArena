const admin = require("firebase-admin");
const natural = require("natural");

const TfIdf = natural.TfIdf;

/* =====================================
   KEYWORD FREQUENCY SCORING
===================================== */

function keywordScore(text, keywords) {

  let score = 0;

  keywords.forEach(keyword => {

    const word = keyword.toLowerCase();

    const regex = new RegExp(`\\b${word}\\b`, "g");

    const matches = text.match(regex);

    if (matches) {
      score += matches.length;
    }

  });

  return Math.min(score, 3);

}

/* =====================================
   MAIN FEATURE MAPPER
===================================== */

async function mapPitchToFeatures(pitch, previousPitches = []) {

  const problem = (pitch.problem || "").toLowerCase().trim();
  const solution = (pitch.solution || "").toLowerCase().trim();
  const market = (pitch.market || "").toLowerCase().trim();
  const revenue = (pitch.revenue || "").toLowerCase().trim();

  try {

    const db = admin.firestore();

    /* =====================================
       FETCH KEYWORDS FROM FIRESTORE
    ===================================== */

    const problemDoc =
      await db.collection("keywordConfig").doc("problem").get();

    const solutionDoc =
      await db.collection("keywordConfig").doc("solution").get();

    const marketDoc =
      await db.collection("keywordConfig").doc("market").get();

    const revenueDoc =
      await db.collection("keywordConfig").doc("revenue").get();

    const problemKeywords =
      problemDoc.data()?.keywords || [];

    const solutionKeywords =
      solutionDoc.data()?.keywords || [];

    const marketKeywords =
      marketDoc.data()?.keywords || [];

    const revenueKeywords =
      revenueDoc.data()?.keywords || [];

    /* =====================================
       STRUCTURED FEATURE SCORES
    ===================================== */

    const problemScore =
      keywordScore(problem, problemKeywords);

    const solutionScore =
      keywordScore(solution, solutionKeywords);

    const marketScore =
      keywordScore(market, marketKeywords);

    const revenueScore =
      keywordScore(revenue, revenueKeywords);

    /* =====================================
       PITCH LENGTH SCORE
    ===================================== */

    const fullPitch =
      problem + " " +
      solution + " " +
      market + " " +
      revenue;

    const wordCount =
      fullPitch.split(/\s+/).filter(w => w).length;

    let pitchLengthScore = 0;

    if (wordCount > 120) pitchLengthScore = 3;
    else if (wordCount > 60) pitchLengthScore = 2;
    else if (wordCount > 25) pitchLengthScore = 1;

    /* =====================================
       VERY WEAK PITCH FILTER
    ===================================== */

    if (wordCount < 10) {

      return [0,0,0,0,0,0,0,0,0,0];

    }

    /* =====================================
       TF-IDF FEATURE GENERATION
    ===================================== */

    const tfidf = new TfIdf();

    const documents = previousPitches.map(p =>
      (
        (p.problem || "") + " " +
        (p.solution || "") + " " +
        (p.market || "") + " " +
        (p.revenue || "")
      ).toLowerCase()
    );

    documents.push(fullPitch);

    documents.forEach(doc => tfidf.addDocument(doc));

    const tfidfTerms =
      tfidf.listTerms(documents.length - 1);

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

    console.log("Feature Vector:", features);

    return features;

  } catch (error) {

    console.error("Feature mapping error:", error);

    return [0,0,0,0,0,0,0,0,0,0];

  }

}

module.exports = { mapPitchToFeatures };